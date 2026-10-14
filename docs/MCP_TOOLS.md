# MCP tools and policies

The tool registry is generated from `src/server/mcp-server.ts`; these statuses describe this source revision.

| Tool | Capability | Risk | State |
|---|---|---:|---|
| `get_health` | Agent and capability health | Low | IMPLEMENTED |
| `list_allowed_roots` | Authorized roots | Low | IMPLEMENTED |
| `list_directory` | Bounded listing, symlink entries labeled | Low | IMPLEMENTED |
| `read_file` | UTF-8 read up to 128 KiB | Low | IMPLEMENTED |
| `get_file_metadata` | Path type, size and modification time | Low | IMPLEMENTED |
| `search_files` | Bounded name/content search | Low | IMPLEMENTED |
| `run_command` | Short read-only allowlisted command | Medium | IMPLEMENTED |
| `start_process` | Bounded allowlisted process session | Medium | IMPLEMENTED |
| `list_processes` | Agent session status | Low | IMPLEMENTED |
| `read_process_output` | Session output/status, pages up to 16 KiB | Low | IMPLEMENTED |
| `terminate_process` | Not registered; policy declares confirmation required | Medium | NOT IMPLEMENTED |
| Desktop, browser, file writes, remote relay operations | Not registered | High | NOT IMPLEMENTED |

The optional HTTP listener is a transport for the existing read-only MCP tools, not an additional tool family. It uses Streamable HTTP with bearer authentication, binds to loopback only, and has no OAuth, device pairing, or public gateway.

All implemented tools are guarded server-side by `READ_ONLY`. The process policy is a conservative allowlist and not a sandbox. Sessions time out after at most 60 seconds and retain at most 64 KiB output. File search is limited by depth, result count, and per-file byte budget.
