# Testing and evidence

Run `npm ci`, `npm run check`, `npm run lint`, `npm test`, and `npm run build` with Node.js 22.19+, 24.11+, or 26+. After building, `npm run smoke:mcp` launches the compiled server over STDIO, discovers tools, reads the repository README through MCP, and runs a harmless `pwd` process through MCP. `npm run smoke:http` launches an ephemeral loopback server and verifies health, unauthenticated rejection, bearer-authenticated MCP initialization, and tool discovery. These commands are included in the GitHub Actions CI workflow.

Statuses used in evidence:

- PASSED: command ran and assertions verified the behavior.
- FAILED: command ran and assertions failed.
- BLOCKED: an OS permission, external service, or configuration is needed.
- NOT_EXECUTED: not run.
- SIMULATED: behavior was represented with a test double, not observed on the Mac.

The automated tests use temporary directories for traversal and symlink probes and run only harmless local processes. They do not use private files, external forms, accounts, or the desktop. Desktop/TCC, browser, OAuth, remote relay, public-host deployment, and ChatGPT/Gemini/Claude end-to-end checks remain NOT_EXECUTED until separately performed.
