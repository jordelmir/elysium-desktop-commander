import { spawn } from 'node:child_process';
import { once } from 'node:events';

const token = 'local-smoke-token-do-not-use-outside-tests-0123456789';
const child = spawn(process.execPath, ['dist/server/http-server.js'], {
  env: { ...process.env, ELYSIUM_REMOTE_TOKEN: token, ELYSIUM_HTTP_PORT: '0', ELYSIUM_HTTP_HOST: '127.0.0.1' },
  stdio: ['ignore', 'ignore', 'pipe'],
});

let stderr = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => { stderr += chunk; });

try {
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('HTTP server startup timed out.')), 5_000);
    child.stderr.on('data', () => {
      const match = stderr.match(/listening on 127\.0\.0\.1:(\d+)\/mcp/);
      if (match) { clearTimeout(timeout); resolve(Number(match[1])); }
    });
    child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`HTTP server exited (${code}): ${stderr}`)); });
  });
  const base = `http://127.0.0.1:${port}`;
  const unauthorized = await fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  if (unauthorized.status !== 401) throw new Error(`Expected unauthenticated request to return 401, got ${unauthorized.status}.`);

  const health = await fetch(`${base}/healthz`);
  if (health.status !== 200 || (await health.text()) !== 'ok') throw new Error('Health endpoint did not respond as expected.');

  const initialize = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'elysium-smoke', version: '1.0.0' } } }),
  });
  if (initialize.status !== 200) throw new Error(`Authenticated MCP initialize failed with HTTP ${initialize.status}.`);
  const initializeBody = await initialize.json();
  if (!initializeBody.result?.serverInfo?.name?.includes('elysium-desktop-commander')) throw new Error('Unexpected MCP server identity.');

  const tools = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-03-26' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  });
  if (tools.status !== 200) throw new Error(`Authenticated tools/list failed with HTTP ${tools.status}.`);
  const toolResponse = await tools.json();
  const names = toolResponse.result?.tools?.map((tool) => tool.name) ?? [];
  if (!names.includes('get_health') || !names.includes('read_file')) throw new Error('MCP tool discovery omitted expected local tools.');
  process.stdout.write(`PASSED: loopback health; unauthenticated request rejected; authenticated MCP initialized; discovered ${names.length} tools.\n`);
} finally {
  child.kill('SIGTERM');
  await once(child, 'exit').catch(() => undefined);
}
