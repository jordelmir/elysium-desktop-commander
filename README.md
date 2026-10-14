# Elysium Desktop Commander

Local-first MCP tools for Codex and other MCP clients on macOS. Version 0.2.0 exposes bounded read-only filesystem tools and a narrow allowlist of process diagnostics over MCP STDIO or an opt-in, bearer-authenticated Streamable HTTP endpoint bound to loopback. It does not contain desktop/browser automation, OAuth, device pairing, or an outbound remote relay.

## Requirements

- Node.js 22.19+, 24.11+, or 26+
- npm
- Codex CLI for MCP integration (optional for direct local use)

## Install and verify

```sh
cd ~/Projects/elysium-desktop-commander
npm ci
npm run check
npm run lint
npm test
npm run build
npm run smoke:mcp
npm run smoke:http
```

## Run locally

```sh
npm run mcp
```

The server uses the current working directory as the default authorized root. Set `ELYSIUM_ALLOWED_ROOTS` to a platform-separated list of explicitly authorized roots. Set `ELYSIUM_AUDIT_LOG` to opt into metadata-only audit records. No telemetry is enabled.

## Remote MCP endpoint (local loopback only)

After building, start the optional HTTP endpoint with a unique random token of at least 32 bytes:

```sh
ELYSIUM_REMOTE_TOKEN='replace-with-a-long-random-secret' npm run start:http
```

The endpoint listens on `127.0.0.1:8765/mcp` and requires `Authorization: Bearer …`. It refuses non-loopback bind addresses. To reach it remotely, use a supported authenticated HTTPS tunnel or deploy a separate gateway/reverse proxy with TLS and access control. Do not expose the Mac's port directly. This endpoint currently has no OAuth authorization server, device pairing, revocation registry, or outbound relay; it is not a production remote-control deployment and may not be accepted by clients that require OAuth. Use it only with trusted clients that securely store bearer tokens.

## Update and uninstall

To update dependencies within the pinned ranges, review package changes, run `npm update`, then run the full verification steps above. Intentional version changes belong in `package.json` and `package-lock.json` together.

To disconnect the server from Codex, run `codex mcp remove elysium-desktop-commander`. To remove the local checkout, first preserve any work you need, then remove `~/Projects/elysium-desktop-commander` yourself. Unregistering the server does not delete the project or its logs.

## Codex registration

Only after build and tests pass, register the compiled server:

```sh
codex mcp add elysium-desktop-commander -- node "$HOME/Projects/elysium-desktop-commander/dist/server/main.js"
```

Then inspect with `codex mcp list` and restart Codex if needed. The server's launch directory is its default authorized root; configure additional roots deliberately in Codex MCP environment settings. Registration in Codex does not provide a ChatGPT remote connector.

## Security boundary

The agent runs with the current user's OS privileges. Path roots and the executable allowlist are application guardrails, not a sandbox. The default `READ_ONLY` profile exposes no file writes, arbitrary shell, process termination, secrets, browser storage, desktop actions, network relay, or public listener. The optional loopback HTTP endpoint exposes the same read-only tools and is disabled unless explicitly started with a strong bearer token. See [Security](docs/SECURITY.md) and [Threat model](docs/THREAT_MODEL.md).

## Capability status

Implemented: health, authorized roots, bounded directory listing, bounded UTF-8 reads, metadata, bounded content/name search, read-only diagnostic commands, process session observation, and authenticated loopback Streamable HTTP. Pending: OAuth, interactive approval, writes, process cancellation, macOS GUI automation, browser adapter, device pairing, outbound relay, and an externally hosted Elysium gateway. See [tool inventory](docs/MCP_TOOLS.md), [reference audit](docs/REFERENCE_AUDIT.md), and [tests](docs/TESTING.md).

## License

MIT. See `LICENSE`.
