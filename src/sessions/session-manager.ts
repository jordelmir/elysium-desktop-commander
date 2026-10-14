import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export interface CommandSpec { executable: string; args: string[]; cwd: string; timeoutMs?: number }
export interface ProcessSession {
  id: string;
  executable: string;
  startedAt: string;
  status: 'running' | 'exited' | 'timed_out' | 'failed';
  exitCode: number | null;
  output: string;
  outputBytes: number;
  truncated: boolean;
}

const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_SESSIONS = 8;

export class SessionManager {
  private readonly entries = new Map<string, { session: ProcessSession; child: ChildProcessWithoutNullStreams; timer: NodeJS.Timeout }>();

  start(spec: CommandSpec): ProcessSession {
    if (!isCommandAllowed(spec.executable, spec.args)) throw new Error('Command is not permitted by the READ_ONLY command policy.');
    if (this.entries.size >= MAX_SESSIONS) throw new Error('Maximum process session count reached.');
    const timeoutMs = Math.min(Math.max(spec.timeoutMs ?? 10_000, 100), 60_000);
    const child = spawn(spec.executable, spec.args, {
      cwd: spec.cwd,
      env: { PATH: process.env.PATH ?? '/usr/bin:/bin:/opt/homebrew/bin', LANG: 'C', LC_ALL: 'C' },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const session: ProcessSession = {
      id: randomUUID(), executable: spec.executable, startedAt: new Date().toISOString(),
      status: 'running', exitCode: null, output: '', outputBytes: 0, truncated: false,
    };
    const push = (chunk: Buffer) => {
      const remaining = MAX_OUTPUT_BYTES - session.outputBytes;
      if (remaining > 0) {
        const retained = chunk.subarray(0, remaining);
        session.output += retained.toString('utf8');
        session.outputBytes += retained.byteLength;
      }
      if (chunk.byteLength > remaining) session.truncated = true;
    };
    child.stdout.on('data', push);
    child.stderr.on('data', push);
    const timer = setTimeout(() => {
      session.status = 'timed_out';
      child.kill('SIGTERM');
    }, timeoutMs);
    timer.unref();
    this.entries.set(session.id, { session, child, timer });
    child.on('error', () => { session.status = 'failed'; clearTimeout(timer); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (session.status === 'running') session.status = code === 0 ? 'exited' : 'failed';
      session.exitCode = code;
      child.stdin.end();
    });
    return session;
  }

  get(id: string): ProcessSession {
    const entry = this.entries.get(id);
    if (!entry) throw new Error('Unknown process session.');
    return entry.session;
  }

  list(): ProcessSession[] { return [...this.entries.values()].map(({ session }) => session); }

  async wait(id: string, waitMs = 500): Promise<ProcessSession> {
    const entry = this.entries.get(id);
    if (!entry) throw new Error('Unknown process session.');
    if (entry.session.status === 'running') {
      await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(waitMs, 0), 2_000)));
    }
    return entry.session;
  }
}

export function isCommandAllowed(executable: string, args: string[]): boolean {
  const name = executable.split('/').at(-1) ?? executable;
  if (name === 'pwd' || name === 'whoami' || name === 'uname' || name === 'date') return args.length <= 2;
  if (name === 'ls') return args.every((arg) => /^-[alh]+$/.test(arg));
  if (name === 'sleep') return args.length === 1 && /^\d+(\.\d+)?$/.test(args[0] ?? '') && Number(args[0]) <= 60;
  if (name === 'git') return args.length === 1 && ['status', 'rev-parse', 'log'].includes(args[0] ?? '') && (args[0] !== 'log');
  return false;
}
