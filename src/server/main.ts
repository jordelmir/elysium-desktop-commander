import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

const server = createMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);

process.on('SIGINT', () => { void server.close().finally(() => process.exit(0)); });
process.on('SIGTERM', () => { void server.close().finally(() => process.exit(0)); });
