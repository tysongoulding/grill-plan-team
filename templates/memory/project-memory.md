# Local Project Memory (grill-plan-team)

Repository-specific context, conventions, architectural decisions, and learned lessons.

## Project Archetype & Domain Terminology
- Archetype: Cross-harness AI agent workflow engine and installer CLI.
- Domain terms:
  - Harness: Target IDE or coding agent host (Antigravity, Claude Code, Cursor, Windsurf, Roo Code, Kimi Code, Hermes Agent, Pi Agent, Oh My Pi, OpenCode, Codex, Grok Build).
  - 3-Phase Gate: Grill-Me (interview) -> Plan (blueprint) -> Teamwork (execution).
  - Two-Tier Memory: Global user profile (~/.config/grill-plan-team) + local project memory (.grill-plan-team).

## Established Repository Conventions
- Dependencies: Zero external runtime dependencies; use native Node.js / POSIX bash APIs.
- Testing: node:test with strict parity testing between install.sh and bin/install.js.
- Governance: Gated phase progression; changes committed cleanly to git.

## Architectural Decision History
- [Initial Bootstrap]: Established unified 3-phase gated pipeline with cross-harness parity.

## Past Pitfalls & Reviewer Lessons
- Parity requirement: Any CLI or template change must be mirrored across both bin/install.js and install.sh.
- Path normalization: Always resolve paths and trim whitespace when handling user inputs.
