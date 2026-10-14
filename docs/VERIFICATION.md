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
| Authenticated HTTP smoke | PASSED | `npm run smoke:http`; loopback health, unauthenticated 401, bearer-authenticated MCP initialize, 10 tools discovered |
| Dependency audit | PASSED | `npm audit --audit-level=moderate`; 0 vulnerabilities |
| Codex registration | PASSED | `codex mcp list` reports Elysium enabled; Codex TOML parses; earlier server entries preserved |
| Codex live call | PASSED | Fresh ephemeral `codex exec` called `get_health` and `list_processes`; returned `READ_ONLY`, `darwin`, relay disabled, 0 sessions |
| GitHub Actions | PASSED | Public `main` push run completed successfully for commit `b6d21239d0df564a5f5aa9bdffc375ae0a02b128`; check, lint, tests, build, both smoke checks and production dependency audit |

## REA audit

- Published package resolved to `rea-agents@6.4.0`; Node.js requirement is met by installed Node 26.
- Setup added only the REA registration to Codex and made a backup. The actual MCP `tools/list` returned 170 tools.
- `analyze_javascript_application` ran against the built `dist/` directory: 45 relevant files, 30 parsed JavaScript files, 0 parse failures, complete application coverage, semantic coverage unknown, 177 findings. This is static evidence; no runtime behavior was inferred.
- REA setup doctor reports `environment_healthy=false`; Ghidra/JDK are installed, but this host/provider combination is marked unsupported. No Ghidra-based analysis was claimed.

## Not executed / pending

| Area | State | Reason |
|---|---|---|
| macOS screenshot, Accessibility, UI actions through Elysium | NOT_EXECUTED | No adapter is implemented; TCC permissions were not probed or requested |
| Browser automation | NOT_EXECUTED | Adapter is not implemented |
| File writes, interactive policy, cancellation | NOT_EXECUTED | Not exposed by the READ_ONLY MVP |
| Elysium remote gateway, OAuth, relay, device pairing and revocation | NOT_EXECUTED | The new Elysium HTTP transport is local loopback only; no identity service or public gateway is deployed |
| Elysium macOS desktop control | NOT_EXECUTED | The Elysium MVP has no screenshot, Accessibility, or UI-control adapter |
| Elysium public remote acceptance | BLOCKED | Requires OAuth identity, outbound relay, TLS/domain and infrastructure decisions |

## Existing vendor Remote Desktop Commander (separate from Elysium)

| Check | Result | Evidence |
|---|---|---|
| Remote Device process | PASSED | Existing `desktop-commander remote` process remained active; it was not restarted or stopped |
| Device registration | PASSED | Official device dashboard showed `MacBook-Air-de-Jorge.local` as Online |
| ChatGPT read call | PASSED | ChatGPT's Remote Desktop Commander app returned the paired agent's working directory; the private path is omitted from this public record |
| ChatGPT file write | PASSED | Created `/tmp/elysium-remote-mcp-write-test.txt` with a test marker; verified the exact contents locally; removed the temporary file |
| ChatGPT code execution | PASSED | Remote `node -p '6 * 7'` returned `42` |
| Gemini web app | PASSED | Added the custom MCP app; Gemini listed 31 actions, returned the paired device Online on macOS, and ran `node -p '6 * 7'` with explicit tool approval, returning `42` |
| Codex CLI | PASSED | OAuth completed; a fresh ephemeral call to remote `who_am_i` reported one paired device |
| Gemini CLI | CONFIGURED, NOT CONNECTED | User-scope endpoint is present, but CLI login requires a valid Google Cloud project environment setting; no project or billing resource was created |
| Antigravity | CONFIGURED, AUTH PENDING | Endpoint was added to the existing global MCP profile while preserving its servers; OAuth needs the app window, and macOS was locked during this attempt |
| Claude Code | NOT CONNECTED | Endpoint is registered; official pricing places Claude Code on Pro/Max, so no plan upgrade or API billing was started |
| Claude web | AUTH PENDING | Current official help allows one custom connector on Free, but the browser is signed out; sign-in/account creation was not attempted |
| OpenCode | NOT CONFIGURED | Its existing user config fails schema validation on unrelated provider keys; it was left untouched to preserve the profile |

The existing vendor connector is verified for remote read/write/terminal use from ChatGPT. Gemini web and Codex CLI were verified with read-only calls. Its Remote Device agent and hosted service are separate from this open-source Elysium implementation. No screen capture or GUI-control action was used in this verification.
