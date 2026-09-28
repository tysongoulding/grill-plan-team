# Engineering Requirements & Technical Guardrails (grill-plan-team)

Technical guardrails, VCS workflows, language and library preferences, architectural records, and reviewer lessons.

## Guardrails & Safety
- Dependency policy: Zero external runtime dependencies; prioritize native runtime APIs (Node.js built-ins, standard libraries).
- Test integrity: Never bypass, weaken, skip, or mock tests to achieve a passing state; run comprehensive test suites.
- Safety boundaries: Defensive validation at integration seams; no destructive operations or unapproved force-pushes.
- Compatibility: Maintain strict backward compatibility and non-breaking changes across releases.

## VCS & Repository Processes
- Preferred VCS tool: Official GitHub CLI (`gh`) and standard `git`.
- Remote providers: GitHub (primary), with support for GitLab, Bitbucket, and custom git origins.
- Branching & commits: Clean commit messages following conventional commits; local verification before push.
- PR & review process: Structured descriptions, verification proof, and automated CI passing checks.

## Preferred Languages & Runtimes
- Primary languages: TypeScript, modern JavaScript (ESM/CJS), Bash/POSIX shell, Python.
- Runtimes: Modern Node.js LTS (v20+, v22+), standard shell environments.
- Typing: Strict TypeScript compilation with `noEmit` type checking.

## Preferred Libraries & Frameworks
- Test frameworks: Native test runner (`node:test`, `node:assert`), zero heavy testing framework bloat.
- CLI & scripting: Built-in `child_process`, `fs`, `path`, `os`, and standard POSIX shell tools.

## Architectural Decision History
- [Initial Bootstrap]: Established unified 4-phase gated pipeline (Step 0 Recall -> Phase 1 Grill-Me -> Phase 2 Plan -> Phase 3 Teamwork -> Phase 4 Distill) with cross-harness parity.

## Past Pitfalls & Reviewer Lessons
- Parity requirement: Any CLI or template change must be mirrored across both `bin/install.js` and `install.sh`.
- Path normalization: Always resolve paths and trim whitespace when handling user inputs.
- Cross-harness compatibility: Do not bind phase execution to proprietary subagent names.
