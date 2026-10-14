# Reference audit

Research snapshot: 2026-10-13. Public documentation and repository pages were inspected; installed capabilities are reported separately from upstream documentation.

| Capability | Public evidence | Elysium design | State |
|---|---|---|---|
| REA identity/version | `morluto/rea` README and npm package `rea-agents@6.4.0`; MIT; installed setup reports skill aligned and Codex registration configured | Use as research MCP, not as desktop controller | IMPLEMENTED (registration); PARTIAL (native analysis environment) |
| REA installed tool catalog | Connected to pinned `rea-agents@6.4.0` MCP process and called `tools/list`: 170 tools returned, including `analyze_javascript_application` and `capture_process_scenario` | Use only the capabilities in the live catalog | IMPLEMENTED (verified) |
| REA source analysis | Ran `analyze_javascript_application` against this build's `dist/` with summary output; 45 relevant files, 30 parsed JavaScript files, 0 parse failures, application coverage complete, semantic coverage unknown | Treat it as structural evidence only; it did not verify runtime semantics or remote behavior | IMPLEMENTED (analysis run; bounded result) |
| REA provider | Setup doctor finds Ghidra 12.1.4/JDK 21, but `environment_healthy=false` and marks macOS arm64 unsupported for the selected provider path | Preserve this limitation; REA's JS source analysis did not depend on Ghidra | PARTIAL |
| MCP local | Official MCP SDK is used over STDIO | TypeScript server and actual tools | IMPLEMENTED |
| Files | Desktop Commander docs list bounded recursive listing, read/write, metadata, and symlink guardrails | Read-only roots, bounded listing/read/metadata/name-content search | IMPLEMENTED (read subset) |
| Terminal | Desktop Commander docs list command execution, timeout, processes, pagination, sessions | No shell; allowlisted diagnostics, process sessions and capped output | IMPLEMENTED (restricted subset) |
| Long processes | Public Desktop Commander docs describe process interaction and output paging | Bounded session ID/status/output and internal timeout | PARTIAL (no interactive stdin or cancellation tool) |
| macOS screenshot/windows/accessibility/UI automation | Public Desktop Commander feature list describes desktop capabilities; macOS TCC applies | Future macOS adapter must honor Screen Recording, Accessibility and Apple Events | DOCUMENTED; NOT EXECUTED |
| Browser automation | Requirement in user spec; no browser adapter used by this build | Future isolated adapter; never read cookies/passwords | DOCUMENTED; NOT EXECUTED |
| Vendor remote pairing | Remote setup docs describe hosted MCP, local paired agent, and HTTPS connector | Independent future Elysium gateway and relay; do not copy private implementation | DOCUMENTED |
| Elysium remote transport | Official MCP SDK supports Streamable HTTP; vendor setup describes a separate hosted service | Optional loopback-only bearer-authenticated Streamable HTTP endpoint; no public port | IMPLEMENTED (local endpoint); NOT EXECUTED (external client) |
| Elysium remote identity/pairing/relay | MCP auth documentation and vendor setup describe separate identity and device-pairing requirements | OAuth, owner-confirmed pairing, outbound relay, revocation and deployed gateway | NOT IMPLEMENTED |
| Codex registration | Global Codex config now includes `elysium-desktop-commander`; `codex mcp list` reports enabled; pre-edit config backup is retained | Local STDIO entry points to compiled server and authorizes only this repository | IMPLEMENTED |
| Codex live discovery | New ephemeral `codex exec` called the registered `get_health` tool and received `READ_ONLY`, `darwin`, and `remoteRelay=false`; separate STDIO smoke discovered all 10 and read a file and ran `pwd` | Requires a new Codex process after future configuration updates | IMPLEMENTED (local end-to-end) |

## Sources and license notes

- [REA repository](https://github.com/morluto/rea): repository labels its authored source MIT; third-party dependency notices remain separately applicable.
- [REA installation](https://github.com/morluto/rea/blob/main/docs/installation.md), [MCP contracts](https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md), [architecture](https://github.com/morluto/rea/blob/main/docs/architecture.mermaid), and [process capture](https://github.com/morluto/rea/blob/main/docs/process-capture.md).
- [Desktop Commander local server](https://github.com/wonderwhy-er/DesktopCommanderMCP): public feature list covers filesystem, terminal/process sessions, pagination and safety guardrails. The project is used as reference only; no source was copied.
- [Remote Desktop Commander setup](https://github.com/desktop-commander/remote-desktop-commander/blob/main/docs/SETUP.md): public description distinguishes hosted MCP, paired local agent and assistant connector. Its service is not Elysium.
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk): official SDK dependency, MIT.

The currently registered vendor server is `@wonderwhy-er/desktop-commander@0.3.0`; a separate remote pairing process is still running. Neither counts as an Elysium capability.
