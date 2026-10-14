# Security and permissions

The current version is a local developer tool with a read-only MCP surface. It executes as the logged-in Mac user, so it is not a sandbox. Only explicitly configured roots are exposed through file tools. The default root is the working directory from which Codex launches the MCP server.

The process tool uses direct executable plus argument vectors and a deliberately narrow allowlist. It does not accept shell pipelines, redirections, arbitrary scripts, or environment overrides. `git status` and bounded read-only diagnostics are allowed; process termination and writes are not exposed.

No remote credentials are stored in the repository. An optional loopback-only Streamable HTTP endpoint accepts one bearer token from the environment and exposes the same read-only tools. It has no OAuth, device identity/pairing, token expiry/revocation, or outbound relay. Do not expose it directly to the internet; use a separately reviewed TLS tunnel/proxy and securely managed credentials. Audit logging is opt-in and excludes file contents and process output. Telemetry is not implemented.

macOS screen recording, Accessibility, and Apple Events permissions are not requested by this build. No mechanism bypasses TCC. Future desktop functionality must check real OS authorization and explain any user action required before claiming availability.

Report a suspected vulnerability privately to the repository owner; do not include real user data in a reproduction.
