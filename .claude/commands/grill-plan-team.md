# /grill-plan-team [feature or goal]

Initiates the gated development workflow with two-tier recursive memory for the specified task or feature:
0. **Step 0 (Recall)**: Ingest developer assessment (`ASSESSMENT.md`) and technical requirements (`REQUIREMENTS.md`).
1. **Phase 1 (Grill-Me)**: Conduct baseline onboarding (if missing or requested) and adaptive architectural interview.
2. **Phase 2 (Plan)**: Generate an implementation plan artifact grounded in repository conventions and past ADRs. Stop and wait for user approval.
3. **Phase 3 (Teamwork)**: Execute the plan using autonomous task execution and programmatic verification.
4. **Phase 4 (Distill)**: Distill interview overrides, architectural decisions, and testing lessons into `ASSESSMENT.md` and `REQUIREMENTS.md`.

---

## Instructions

When the user runs `/grill-plan-team $ARGUMENTS`:

0. **Step 0: Memory Recall**:
   - Ingest developer assessment from `.grill-plan-team/ASSESSMENT.md` or `~/.config/grill-plan-team/ASSESSMENT.md`.
   - Ingest requirements & guardrails from `.grill-plan-team/REQUIREMENTS.md` or `~/.config/grill-plan-team/REQUIREMENTS.md`.

1. **Phase 1: Adaptive Alignment (Grill-Me)**:
   - **Baseline Onboarding**: If baseline documents are missing or if the user requests a reset (`re-assess`, `update preferences`), prompt for scope (User Global vs Project Local), role & AI experience, and guardrails/VCS/stack to initialize `ASSESSMENT.md` and `REQUIREMENTS.md`.
   - Identify the primary technical domains and uncertainties of `$ARGUMENTS`.
   - Skip trivial questions already resolved in memory.
   - Explore existing codebase patterns, configurations, and dependencies.
   - Formulate the first architectural decision question with structured multiple choice options (keep options concise):
     - `A) Option 1`
     - `B) (Recommended) Option 2 - [Concise engineering rationale] (Aligned with user/project memory)`
     - `C) Option 3`
   - Ask only ONE question and pause for the user's answer.
   - Continue walking the decision tree until all scope boundaries, data models, and edge cases are agreed upon.

2. **Phase 2: Technical Design & Verification (Plan)**:
   - Once alignment is achieved, write an implementation blueprint artifact to `.claude/plans/<feature>_plan.md` or the active artifacts folder.
   - Ground changes in established conventions, past ADRs, and pitfall avoidance.
   - Outline goal, review items, file diffs, and verification commands (`npm test`, typecheck, etc.).
   - Explicitly ask the user: *"Does this plan meet your expectations? Please approve to proceed to Phase 3 (Teamwork execution)."*
   - **Do NOT begin code modification until the user explicitly approves.**

3. **Phase 3: Multi-Agent Task Execution (Teamwork)**:
   - Execute the approved plan.
   - Verify every requirement using the programmatic verification commands.
   - Report results with verified vs unverified items and diff summary.

4. **Phase 4: Reflection & Distillation Loop**:
   - Distill new user choices into `ASSESSMENT.md` (`## Distilled User Preferences`).
   - Append locked architectural decisions to `REQUIREMENTS.md` (`## Architectural Decision History`).
   - Append debugging/reviewer lessons to `REQUIREMENTS.md` (`## Past Pitfalls & Reviewer Lessons`).
   - Enforce deduplication and concise bullet points.
