import { randomUUID } from 'node:crypto';
import { lstat, opendir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuditLogger } from '../audit/audit-logger.js';
import { PathGuard } from '../security/path-guard.js';
import { assertReadOnly, policyProfile, toolPolicies } from '../security/policy.js';
import { SessionManager } from '../sessions/session-manager.js';

const MAX_FILE_BYTES = 128 * 1024;
const MAX_DIRECTORY_ENTRIES = 200;
const MAX_SEARCH_RESULTS = 50;
const MAX_SEARCH_FILE_BYTES = 256 * 1024;
const MAX_SEARCH_ENTRIES = 2_000;
const MAX_SEARCH_BYTES = 16 * 1024 * 1024;
const allowedRoots = (process.env.ELYSIUM_ALLOWED_ROOTS ?? process.cwd())
  .split(path.delimiter).map((root) => path.resolve(root)).filter(Boolean);
const guard = new PathGuard(allowedRoots);
const sessions = new SessionManager();
const audit = new AuditLogger(process.env.ELYSIUM_AUDIT_LOG);

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'elysium-desktop-commander', version: '0.2.0' });

  const register = (name: string, description: string, schema: Record<string, z.ZodType>, handler: (args: Record<string, unknown>) => Promise<unknown>) => {
    server.registerTool(name, { description, inputSchema: schema }, async (args) => {
      const callId = randomUUID();
      const started = Date.now();
      try {
        assertReadOnly(name);
        const result = await handler(args as Record<string, unknown>);
        await audit.record({ callId, tool: name, durationMs: Date.now() - started, outcome: 'success' });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (error) {
        await audit.record({ callId, tool: name, durationMs: Date.now() - started, outcome: 'error', errorCode: error instanceof Error ? error.name : 'UnknownError' });
        return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Operation failed.' }] };
      }
    });
  };

  register('get_health', 'Return agent health, active policy, platform support and session count.', {}, async () => ({
    status: 'ok', name: 'elysium-desktop-commander', version: '0.2.0', platform: process.platform,
    policy: policyProfile, activeSessions: sessions.list().filter((s) => s.status === 'running').length,
    capabilities: { filesystemRead: true, allowlistedProcesses: true, filesystemWrite: false, desktopAutomation: false, browserAutomation: false, remoteRelay: false },
    permissions: { screenRecording: 'not_checked', accessibility: 'not_checked', appleEvents: 'not_checked' },
  }));

  register('list_allowed_roots', 'List the filesystem roots explicitly authorized for reads and process working directories.', {}, async () => ({ roots: allowedRoots }));

  register('list_directory', 'List a bounded directory without following symlink entries.', {
    path: z.string().default('.'), limit: z.number().int().min(1).max(MAX_DIRECTORY_ENTRIES).default(100),
  }, async (args) => {
    const target = await guard.resolveExisting(String(args.path));
    const info = await stat(target);
    if (!info.isDirectory()) throw new Error('Path is not a directory.');
    const limit = Number(args.limit);
    const entries = [];
    const dir = await opendir(target);
    for await (const entry of dir) {
      entries.push({ name: entry.name, type: entry.isSymbolicLink() ? 'symlink' : entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other' });
      if (entries.length > limit) break;
    }
    const truncated = entries.length > limit;
    return { path: target, observedEntries: entries.length - Number(truncated), truncated, entries: entries.slice(0, limit) };
  });

  register('read_file', 'Read a UTF-8 text file under an authorized root with a strict byte limit.', {
    path: z.string(), maxBytes: z.number().int().min(1).max(MAX_FILE_BYTES).default(32 * 1024),
  }, async (args) => {
    const target = await guard.assertRegularFile(String(args.path));
    const info = await stat(target);
    if (info.size > Number(args.maxBytes)) throw new Error(`File exceeds the requested maximum (${info.size} bytes).`);
    const content = await readFile(target, 'utf8');
    return { path: target, bytes: info.size, content };
  });

  register('get_file_metadata', 'Return non-content metadata for an authorized path.', { path: z.string() }, async (args) => {
    const target = await guard.resolveExisting(String(args.path));
    const [info, linkInfo] = await Promise.all([stat(target), lstat(String(args.path))]);
    return { path: target, type: info.isDirectory() ? 'directory' : info.isFile() ? 'file' : 'other', sizeBytes: info.size, modifiedAt: info.mtime.toISOString(), isSymlink: linkInfo.isSymbolicLink() };
  });

  register('search_files', 'Search file names beneath an authorized root with bounded depth and result count.', {
    path: z.string().default('.'), query: z.string().min(1).max(200), maxDepth: z.number().int().min(0).max(8).default(4), limit: z.number().int().min(1).max(MAX_SEARCH_RESULTS).default(30),
  }, async (args) => {
    const root = await guard.resolveExisting(String(args.path));
    const query = String(args.query).toLowerCase();
    const maxDepth = Number(args.maxDepth);
    const limit = Number(args.limit);
    const matches: Array<{ path: string; match: 'name' | 'content' }> = [];
    let truncated = false;
    let inspectedEntries = 0;
    let inspectedBytes = 0;
    const visit = async (dir: string, depth: number): Promise<void> => {
      if (matches.length >= limit || depth > maxDepth || inspectedEntries >= MAX_SEARCH_ENTRIES || inspectedBytes >= MAX_SEARCH_BYTES) { truncated = true; return; }
      const directory = await opendir(dir);
      for await (const entry of directory) {
        inspectedEntries++;
        if (inspectedEntries > MAX_SEARCH_ENTRIES) { truncated = true; return; }
        if (entry.isSymbolicLink()) continue;
        const full = path.join(dir, entry.name);
        if (entry.name.toLowerCase().includes(query)) matches.push({ path: full, match: 'name' });
        else if (entry.isFile()) {
          const info = await stat(full);
          if (info.size <= MAX_SEARCH_FILE_BYTES && inspectedBytes + info.size <= MAX_SEARCH_BYTES) {
            const text = await readFile(full, 'utf8').catch(() => '');
            inspectedBytes += info.size;
            if (text.toLowerCase().includes(query)) matches.push({ path: full, match: 'content' });
          } else if (info.size <= MAX_SEARCH_FILE_BYTES) truncated = true;
        } else if (entry.isDirectory() && depth < maxDepth) await visit(full, depth + 1);
        if (matches.length >= limit || inspectedEntries >= MAX_SEARCH_ENTRIES || inspectedBytes >= MAX_SEARCH_BYTES) { truncated = true; return; }
      }
    };
    await visit(root, 0);
    return { root, matches, truncated, inspectedEntries, inspectedBytes };
  });

  register('run_command', 'Run a short, read-only allowlisted command without a shell. No arbitrary command or shell syntax is accepted.', {
    executable: z.enum(['pwd', 'whoami', 'uname', 'date', 'ls', 'git']),
    args: z.array(z.string().max(200)).max(8).default([]),
    cwd: z.string().default(process.cwd()), timeoutMs: z.number().int().min(100).max(60_000).default(10_000),
  }, async (args) => {
    const cwd = await guard.resolveExisting(String(args.cwd));
    const session = sessions.start({ executable: String(args.executable), args: args.args as string[], cwd, timeoutMs: Number(args.timeoutMs) });
    for (let i = 0; i < 40 && session.status === 'running'; i++) await new Promise((resolve) => setTimeout(resolve, 50));
    return processSummary(session);
  });

  register('start_process', 'Start an allowlisted bounded process session. The command still runs with this user account privileges.', {
    executable: z.enum(['sleep', 'pwd', 'whoami', 'uname', 'date', 'ls', 'git']),
    args: z.array(z.string().max(200)).max(8).default([]), cwd: z.string().default(process.cwd()), timeoutMs: z.number().int().min(100).max(60_000).default(10_000),
  }, async (args) => {
    const cwd = await guard.resolveExisting(String(args.cwd));
    return sessions.start({ executable: String(args.executable), args: args.args as string[], cwd, timeoutMs: Number(args.timeoutMs) });
  });

  register('list_processes', 'List process session metadata created by this agent without including process output.', {}, async () => ({ sessions: sessions.list().map(processSummary) }));
  register('read_process_output', 'Read a bounded page of output and status for an agent process session.', {
    sessionId: z.string().uuid(), offset: z.number().int().min(0).default(0), limit: z.number().int().min(1).max(16 * 1024).default(8 * 1024),
  }, async (args) => {
    const session = sessions.get(String(args.sessionId));
    const offset = Number(args.offset);
    const limit = Number(args.limit);
    const output = session.output.slice(offset, offset + limit);
    const nextOffset = offset + output.length;
    return { ...processSummary(session), output, offset, nextOffset, outputLength: session.output.length, complete: nextOffset >= session.output.length, truncated: session.truncated };
  });
  return server;
}

function processSummary(session: ReturnType<SessionManager['get']>) {
  return { id: session.id, executable: session.executable, startedAt: session.startedAt, status: session.status, exitCode: session.exitCode, outputBytes: session.outputBytes, outputTruncated: session.truncated };
}

export { allowedRoots, toolPolicies };
