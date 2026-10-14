import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport, type StreamableHTTPServerTransportOptions } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { createMcpServer } from './mcp-server.js';

const token = process.env.ELYSIUM_REMOTE_TOKEN ?? '';
if (Buffer.byteLength(token) < 32) {
  throw new Error('ELYSIUM_REMOTE_TOKEN must contain at least 32 bytes to start the remote endpoint.');
}

const host = process.env.ELYSIUM_HTTP_HOST ?? '127.0.0.1';
if (host !== '127.0.0.1' && host !== '::1') {
  throw new Error('The local HTTP endpoint only binds to loopback. Use an authenticated TLS tunnel or reverse proxy for remote access.');
}

const port = Number(process.env.ELYSIUM_HTTP_PORT ?? 8765);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('ELYSIUM_HTTP_PORT must be a valid TCP port.');

const expected = createHash('sha256').update(token).digest();

function authorized(request: IncomingMessage): boolean {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  const candidate = createHash('sha256').update(header.slice(7)).digest();
  return timingSafeEqual(expected, candidate);
}

function send(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  res.end(message);
}

const httpServer = createServer(async (request, response) => {
  if (request.url === '/healthz' && request.method === 'GET') {
    send(response, 200, 'ok');
    return;
  }
  if (request.url !== '/mcp') {
    send(response, 404, 'Not found.');
    return;
  }
  if (!authorized(request)) {
    response.writeHead(401, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'www-authenticate': 'Bearer realm="elysium-mcp"',
    });
    response.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  if (request.method !== 'POST' && request.method !== 'GET' && request.method !== 'DELETE') {
    response.setHeader('allow', 'GET, POST, DELETE');
    send(response, 405, 'Method not allowed.');
    return;
  }

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true } as unknown as StreamableHTTPServerTransportOptions);
  const mcpServer = createMcpServer();
  response.on('close', () => { void transport.close(); void mcpServer.close(); });
  try {
    await mcpServer.connect(transport as unknown as Transport);
    await transport.handleRequest(request, response);
  } catch {
    if (!response.headersSent) send(response, 500, 'MCP request failed.');
    else response.end();
    await transport.close().catch(() => undefined);
    await mcpServer.close().catch(() => undefined);
  }
});

httpServer.requestTimeout = 120_000;
httpServer.headersTimeout = 15_000;
httpServer.listen(port, host, () => {
  const address = httpServer.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;
  process.stderr.write(`Elysium MCP HTTP listening on ${host}:${boundPort}/mcp (bearer auth required).\n`);
});

function shutdown(): void {
  httpServer.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
