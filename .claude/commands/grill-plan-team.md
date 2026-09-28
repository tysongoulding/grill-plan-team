# /grill-plan-team [feature or goal]

Initiates the 3-phase gated workflow for the specified task or feature:
1. **Grill-Me**: Conduct an interactive architectural interview (one question at a time, always provide `(Recommended)` options with rationale, explore codebase first).
2. **Plan**: Generate an implementation plan artifact with architectural decisions, file changes, and verification commands. Stop and wait for user approval.
3. **Teamwork**: Delegate and execute the plan using multi-agent task execution and programmatic verification.

---

## Instructions

When the user runs `/grill-plan-team $ARGUMENTS`:

1. **Check Phase 1 (Grill-Me)**:
   - Identify the primary technical domains and uncertainties of `$ARGUMENTS`.
   - Explore existing codebase patterns, configurations, and dependencies.
   - Formulate the first architectural decision question with structured multiple choice options:
     - `A) Option 1`
     - `B) (Recommended) Option 2 - [Concise engineering rationale]`
     - `C) Option 3`
   - Ask only ONE question and pause for the user's answer.
   - Continue walking the decision tree until all scope boundaries, data models, and edge cases are agreed upon.

2. **Phase 2 (Plan)**:
   - Once alignment is achieved, write an implementation blueprint artifact to `.claude/plans/<feature>_plan.md` or the active artifacts folder.
   - Outline goal, review items, file diffs, and verification commands (`npm test`, typecheck, etc.).
   - Explicitly ask the user: *"Does this plan meet your expectations? Please approve to proceed to Phase 3 (Teamwork execution)."*
   - **Do NOT begin code modification until the user explicitly approves.**

3. **Phase 3 (Teamwork)**:
   - Execute the approved plan.
   - Verify every requirement using the programmatic verification commands.
   - Report results with verified vs unverified items and diff summary.
