import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it } from 'vitest';
import { createMcpServer } from '../src/server/mcp-server.js';

describe('MCP protocol integration', () => {
  const server = createMcpServer();
  const client = new Client({ name: 'elysium-test-client', version: '0.0.1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it('discovers the real registry and calls a health tool over MCP', async () => {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const { tools } = await client.listTools();
    expect(tools.map(({ name }) => name)).toContain('read_file');
    expect(tools.map(({ name }) => name)).toContain('run_command');
    const health = await client.callTool({ name: 'get_health', arguments: {} });
    expect(health.isError).not.toBe(true);
    const content = health.content as Array<{ text?: string }>;
    const payload = JSON.parse(content[0]?.text ?? '') as { policy: string; capabilities: { remoteRelay: boolean } };
    expect(payload.policy).toBe('READ_ONLY');
    expect(payload.capabilities.remoteRelay).toBe(false);
  });
});
