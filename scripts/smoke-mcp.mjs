import assert from 'node:assert/strict';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const client = new Client({ name: 'elysium-stdio-smoke', version: '0.1.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(projectRoot, 'dist/server/main.js')],
  cwd: projectRoot,
  env: { ...process.env, ELYSIUM_ALLOWED_ROOTS: projectRoot },
});

try {
  await client.connect(transport);
  const discovered = await client.listTools();
  const names = new Set(discovered.tools.map((tool) => tool.name));
  assert(names.has('read_file'));
  assert(names.has('run_command'));

  const file = await client.callTool({ name: 'read_file', arguments: { path: path.join(projectRoot, 'README.md'), maxBytes: 4096 } });
  assert.equal(file.isError, undefined);
  assert.match(String(file.content[0]?.text), /Elysium Desktop Commander/);

  const command = await client.callTool({ name: 'run_command', arguments: { executable: 'pwd', args: [], cwd: projectRoot } });
  assert.equal(command.isError, undefined);
  assert.match(String(command.content[0]?.text), /"status":"exited"/);

  process.stdout.write(JSON.stringify({ status: 'PASSED', toolsDiscovered: discovered.tools.length, fileRead: true, harmlessProcessRun: true }) + '\n');
} finally {
  await client.close();
}
