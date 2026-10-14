# Architecture

## Local MVP

```text
Codex ── MCP over STDIO ── Elysium MCP server
                               ├── policy registry (READ_ONLY)
                               ├── filesystem path guard
                               ├── bounded process sessions
                               └── privacy-minimal audit logger

Trusted MCP client ── Streamable HTTP + Bearer ── loopback HTTP endpoint
                                                  └── same read-only MCP tools
```

The server runs with the Mac user's operating-system privileges. Its path roots and command allowlist are guardrails, not an OS sandbox. Codex and the server communicate over STDIO; the server does not open a listening port. By default, the only authorized file root and process working directory is the server's launch directory. `ELYSIUM_ALLOWED_ROOTS` can explicitly add roots using the platform path separator.

Filesystem reads canonicalize existing paths with `realpath`, reject paths outside configured roots, skip symlink entries when searching, limit bytes and depth, and return bounded pages. Directory enumeration streams only enough entries for the requested page. Content search caps inspection at 2,000 entries and 16 MiB total input. Process execution uses argument arrays and `shell: false`, a small executable/argument allowlist, a sanitized environment, an 8-session limit, a 60-second maximum, and a 64 KiB output cap. Output is read in pages of up to 16 KiB. An allowed command still inherits the user's OS privileges.

Audit events record call ID, tool name, duration, outcome, and error class only. Audit logging is disabled unless `ELYSIUM_AUDIT_LOG` is set. No file contents or command output are copied to the audit log.

The optional HTTP transport is disabled unless started separately. It accepts only a bearer token of at least 32 bytes and binds to loopback. This avoids opening a Mac port but does not provide OAuth, pairing, per-device identity, or revocation. Remote exposure requires a separate HTTPS tunnel/proxy and its own access policy.

## Boundaries not implemented

Platform adapters for Windows/Linux, macOS screen/window/accessibility automation, browser automation, interactive authorization, writes, remote relay, OAuth identity, pairing, registry, externally hosted gateway, and deployment are not implemented. macOS TCC permissions are not probed or bypassed. Capabilities report these as unavailable.

## Planned remote boundary

After the local product is stable, a local outbound relay may connect to a separately deployed HTTPS MCP gateway. The relay must authenticate both user and device on every operation, enforce per-tool policy locally and remotely, correlate request IDs, apply deadlines/cancellation, heartbeat/reconnect, revoke devices, and avoid public inbound ports on the Mac. Only the optional loopback HTTP transport is implemented; this is not the remote relay architecture.
