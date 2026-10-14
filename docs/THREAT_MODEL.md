# Threat model

## Assets

User files beneath explicitly authorized roots, process resources on the Mac, MCP request/response contents, and the optional local audit trail.

## Threats and current controls

| Threat | Current control | Residual limit |
|---|---|---|
| Path traversal | Canonical paths checked against authorized roots | TOCTOU is possible between path resolution and subsequent read; no write operations exist |
| Symlink escape | Existing paths canonicalized; search skips symlinks | Filesystem can change concurrently after validation |
| Arbitrary command execution | No shell, executable allowlist, restricted Git args | Commands run with the user's OS privileges; allowlists require review |
| Process resource abuse | Eight sessions, 60 second timeout, 64 KiB output | No OS-level CPU/memory sandbox |
| Secret leakage in audit | Logs omit arguments, contents and output | MCP responses can contain requested file text and must be handled as sensitive |
| Unauthenticated HTTP invocation | `/mcp` requires a 32-byte-minimum bearer token and compares fixed-length digests in constant time; unauthenticated calls return 401 | The shared token has no user/device identity, expiry, OAuth flow, or revocation; keep the endpoint loopback-only and do not expose the port |
| Remote network exposure | HTTP server binds only to loopback and rejects non-loopback configuration | A reverse proxy/tunnel is a separate trust boundary and must provide TLS and access control |
| Unintended writes | READ_ONLY profile and no write tools | Process allowlist is a defense-in-depth boundary, not a sandbox |
| Remote unauthorized access | No remote listener or relay implemented | Remote stage requires a separate threat review before release |
| Desktop misclick | No desktop automation implemented | macOS TCC, Accessibility, Screen Recording and Apple Events remain untested |

## Trust boundaries

1. The model and MCP client provide untrusted tool arguments.
2. The MCP process is trusted code running as the local user, but has that user's OS authority.
3. Authorized roots limit product behavior only; they do not replace OS sandboxing.
4. No request reaches a remote gateway in this version.

## Security invariants

- Default profile is READ_ONLY.
- Every exposed tool has an explicit policy entry.
- No shell-string command construction.
- No credentials, browser cookies, or authentication storage access.
- Telemetry is absent and audit logging is opt-in.
- External effects and destructive operations are not exposed.
