# Remote MCP endpoint: loopback transport implemented; public relay not implemented

Version 0.2.0 includes an opt-in MCP Streamable HTTP endpoint at `/mcp`. It binds only to `127.0.0.1` by default, requires a bearer token with at least 32 bytes, and exposes the same read-only tools as the STDIO server. Run `npm run build`, then set `ELYSIUM_REMOTE_TOKEN` and run `npm run start:http`. Use a password manager or OS secret store to create and store the token; do not put it in a repository or shell history. `ELYSIUM_HTTP_PORT` may change the local port. The service refuses any bind host other than loopback.

This endpoint can be used for local MCP transport checks and can sit behind an authenticated HTTPS tunnel. It is not sufficient by itself for reliable remote access: no Elysium account service, OAuth authorization server, device pairing, token revocation registry, outbound relay, or deployment is included. A long-lived bearer token is a bootstrap control, not per-device identity. Do not publish this port directly to the internet.

The hosted Desktop Commander Remote is a separate vendor service and is not used by this code. Registering this local endpoint in Codex does not connect ChatGPT, Gemini, Claude, or another assistant automatically.

## Client compatibility

- Gemini CLI supports Streamable HTTP URLs and bearer headers; its MCP confirmation prompts should remain enabled.
- Claude clients that accept remote HTTP MCP endpoints can use Streamable HTTP, subject to their authentication support and version.
- ChatGPT custom MCP connectors connect to remote HTTPS MCP services. Current full write/modify connector support depends on ChatGPT plan and workspace configuration; this project does not implement the OAuth flow required by configurations that mandate OAuth. A supported Secure MCP Tunnel may provide a private route to local development without opening a public Mac port, but it does not add Elysium pairing or OAuth.

The vendor clients and plan rules change. Check the current official setup pages before configuring them: [ChatGPT MCP apps](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt), [ChatGPT Secure MCP Tunnel](https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta), [Gemini CLI MCP servers](https://geminicli.com/docs/tools/mcp-server/), [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp), and the [MCP TypeScript SDK authorization guide](https://ts.sdk.modelcontextprotocol.io/v2/serving/authorization). These were checked on 2026-10-13. See the README's security limitations before enabling any remote access.

## Required next stage before production remote use

Implement an HTTPS MCP gateway with standard OAuth, user and device identities, explicit owner-confirmed one-time pairing, outbound-only TLS relay from the Mac, per-call authorization, deadlines/cancellation, heartbeat/reconnect, immediate revocation, rate/size/session limits, and minimal transient data retention. Every operation must be authorized again by the local agent. Device identifiers alone confer no permission. Add a native local approval dialog before enabling any operation that writes files, executes unrestricted development commands, or controls the desktop.

Before deployment, document the chosen hosting provider, cost limits, domain/TLS management, secret storage, logging retention, incident response, and end-to-end acceptance evidence. No public port should be opened on the Mac. No hosting provider or budget was selected in this task, and no service is deployed.
