# Global User Memory (grill-plan-team)

Personal developer profile and global engineering preferences across all projects.

## Developer Profile & Interaction Style
- Preferred interaction cadence: direct, concise, technical rationale first.
- Decision preference: present structured multiple-choice recommendations with trade-offs.

## Preferred Tech Stacks & Tooling
- Architecture: modular, minimal runtime dependencies, clean interface boundaries.
- Runtime & language preferences: modern LTS Node.js / TypeScript / native tooling where applicable.
- Testing preference: native test runners (e.g. node:test), zero unnecessary testing frameworks.

## Architectural Heuristics
- Single Responsibility & High Cohesion: keep diffs focused on the exact requested requirement.
- Defensive boundaries: validate inputs at integration seams, keep core logic free of external bloat.
- Self-contained systems: prefer standalone scripts and zero-dependency utilities.

## Workflow Habits & Overrides
- Prioritize non-breaking changes and backward compatibility.
- Ensure thorough automated verification before certifying changes.
