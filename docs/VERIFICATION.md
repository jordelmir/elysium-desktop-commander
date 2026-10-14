# Verification record

Date: 2026-10-13 (local Mac date)

## Local Elysium MVP

| Check | Result | Evidence |
|---|---|---|
| Reproducible dependency install | PASSED | `npm ci`; lockfile installed and npm reported 0 vulnerabilities |
| TypeScript | PASSED | `npm run check` |
| Lint | PASSED | `npm run lint` |
| Unit and security tests | PASSED | `npm test`; 8 tests across path guard, policy/process and MCP integration |
| Build | PASSED | `npm run build` |
| MCP STDIO smoke | PASSED | `npm run smoke:mcp`; discovered 10 tools, read README and ran harmless `pwd` through MCP |
| Dependency audit | PASSED | `npm audit --audit-level=moderate`; 0 vulnerabilities |
| Codex registration | PASSED | `codex mcp list` reports Elysium enabled; Codex TOML parses; earlier server entries preserved |
| Codex live call | PASSED | Fresh ephemeral `codex exec` called `get_health` and `list_processes`; returned `READ_ONLY`, `darwin`, relay disabled, 0 sessions |

## REA audit

- Published package resolved to `rea-agents@6.4.0`; Node.js requirement is met by installed Node 26.
- Setup added only the REA registration to Codex and made a backup. The actual MCP `tools/list` returned 170 tools.
- `analyze_javascript_application` ran against the built `dist/` directory: 45 relevant files, 30 parsed JavaScript files, 0 parse failures, complete application coverage, semantic coverage unknown, 177 findings. This is static evidence; no runtime behavior was inferred.
- REA setup doctor reports `environment_healthy=false`; Ghidra/JDK are installed, but this host/provider combination is marked unsupported. No Ghidra-based analysis was claimed.

## Not executed / pending

| Area | State | Reason |
|---|---|---|
| macOS screenshot, Accessibility, UI actions | NOT_EXECUTED | No adapter is implemented; TCC permissions were not probed or requested |
| Browser automation | NOT_EXECUTED | Adapter is not implemented |
| File writes, interactive policy, cancellation | NOT_EXECUTED | Not exposed by the READ_ONLY MVP |
| Elysium remote gateway, relay, pairing and ChatGPT connector | NOT_EXECUTED | No Elysium remote service is implemented or deployed; the registered vendor Remote Desktop Commander remains separate |
| Remote end-to-end acceptance | BLOCKED | Requires Elysium gateway, identity, TLS/domain and explicit deployment/infrastructure decisions |

The separate vendor Desktop Commander remote agent was observed running after verification; it is not Elysium remote capability evidence.
