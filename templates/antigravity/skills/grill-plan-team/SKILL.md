---
name: grill-plan-team
description: >-
  Self-contained, zero-dependency recursive workflow engine with two-tier memory
  (global user & local project). Ingests memory before Phase 1, conducts an adaptive
  architectural interview (Phase 1), produces a memory-grounded blueprint (Phase 2),
  executes with programmatic verification (Phase 3), and autonomously distills lessons
  into persistent memory (Phase 4). Fully standalone across Antigravity, Claude Code,
  Cursor, Windsurf, and Roo Code.
---

# Grill-Me $\to$ Plan $\to$ Teamwork $\to$ Distill Pipeline (Recursive Memory Engine)

Execute project development across four strictly gated, sequential phases backed by a two-tier recursive memory architecture. **Do not skip or blend phases.** Each phase acts as a prerequisite gate for the subsequent phase. This skill is 100% self-contained and has zero dependencies on external slash commands.

```mermaid
flowchart LR
    M["Step 0: Memory Recall<br/>(User & Project Context)"] --> A["Phase 1: Interactive Alignment<br/>(Grill-Me)"]
    A -->|"User Aligned"| B["Phase 2: Technical Design<br/>(Plan Blueprint)"]
    B -->|"Plan Approved"| C["Phase 3: Multi-Agent Execution<br/>(Teamwork Preview)"]
    C -->|"Verification Passed"| D["Phase 4: Reflection & Distillation<br/>(Continuous Learning)"]
```

---

## Step 0: Memory Recall (Two-Tier Context Retrieval)

Before initiating Phase 1, inspect and ingest persistent memory layers into context:
1. **Global User Memory (`-user`)**:
   - Location: `~/.config/grill-plan-team/user-memory.md` (or `$XDG_CONFIG_HOME/grill-plan-team/user-memory.md`).
   - Stores: Developer preferences, default tech stacks, architectural heuristics, and interaction style.
2. **Local Project Memory (`-per-project`)**:
   - Location: `.grill-plan-team/project-memory.md` in the repository root.
   - Stores: Project archetype, domain terminology, established repository conventions, architectural decision records (ADRs), and reviewer pitfall lessons.
3. If memory files exist, load them silently to prime all recommendations and planning. If they do not exist, proceed using standard defaults.

---

## Phase 1: Interactive Alignment (Grill-Me)

Conduct a targeted, adaptive interview with the user to explore and resolve all technical, UX, and architectural decisions before writing any code or plans.

### Execution Rules:
1. **Adaptive Memory Recall**:
   - Skip trivial questions already answered by user preferences or project memory.
   - Ground decisions in established project conventions and historical decisions.
2. **One Question at a Time**:
   - Use the `ask_question` tool for every decision to present structured, clickable multiple-choice options.
   - Never dump multiple separate questions in a single response unless they are grouped in an atomic `ask_question` call.
3. **Always Recommend with Attribution**:
   - Provide your recommended choice for each question, prefixed with `(Recommended)` and accompanied by a concise engineering rationale.
   - Explicitly cite memory when a recommendation stems from established preferences (e.g., `(Recommended) [Option] - [Rationale] (Aligned with user/project memory)`).
4. **Explore the Codebase First**:
   - Before asking a question, search the codebase (using `view_file`, `run_command`, etc.). If existing conventions, configs, or patterns provide the answer, adopt them instead of asking trivial questions.
5. **Walk the Design Tree**:
   - Resolve decisions branch-by-branch (e.g., Data models $\to$ API contract $\to$ State/Storage $\to$ UI/CLI surface $\to$ Edge cases).
6. **Phase Gate Completion**:
   - Phase 1 concludes only when all dependencies, edge cases, scope boundaries, and architectural tradeoffs have been agreed upon.

---

## Phase 2: Technical Design & Verification (Plan)

Translate the agreed design into a rigorous, actionable engineering blueprint grounded in project memory.

### Execution Rules:
1. **Deep Codebase Exploration & Memory Alignment**:
   - Inspect all relevant files, imports, types, database schemas, and existing test suites to ensure 100% feasibility.
   - Honor established conventions, past architectural decisions (ADRs), and known pitfall avoidances found in `.grill-plan-team/project-memory.md`.
2. **Create Implementation Plan Artifact**:
   - Create an implementation plan artifact at `<Artifact Directory>/<feature>_implementation_plan.md` using `write_to_file` with:
     ```json
     {
       "ArtifactMetadata": {
         "RequestFeedback": true,
         "Summary": "Technical design plan and verification strategy for <feature>",
         "UserFacing": true
       }
     }
     ```
   - Structure the plan with:
     - **Goal Description**: 1–2 sentence problem statement and desired end-state.
     - **User Review Required**: Critical breaking changes or architectural constraints agreed in Phase 1.
     - **Proposed Changes**: Files to create, modify, or delete, grouped by component/layer with code snippets and diffs.
     - **Verification Plan**: Objective, programmatic verification steps (e.g., exact test commands, `tsc --noEmit`, build commands, or E2E scripts).
3. **Phase Gate Approval**:
   - Present the plan artifact link to the user.
   - **Do not proceed to execution or Phase 3 until the user explicitly approves the plan** (e.g., "looks good", "approved", "proceed").

---

## Phase 3: Multi-Agent Swarm Handoff (Teamwork Preview)

Package the approved blueprint into a high-leverage specification and delegate execution to the autonomous `teamwork_preview` multi-agent swarm.

### Execution Rules:

#### 1. Maintain the Prompt Draft Artifact
Create and update `prompt_draft.md` in the artifact directory (`<Artifact Directory>/prompt_draft.md`) using this structure:

```markdown
# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

[Project description — 1-2 sentences]

Working directory: <Target absolute path>
Integrity mode: development

## Requirements

### R1. [Primary Deliverable]
[What to build, focus on behavior and interfaces]

### R2. [Secondary Deliverable / Constraint]
...

## Acceptance Criteria

### [Verification Category]
- [ ] [Objective, programmatic condition: e.g. test command passes with zero errors]
- [ ] [Strict type checking passes: e.g. npx tsc --noEmit]
- [ ] [Build passes: e.g. npm run build]
- [ ] [Git governance: e.g. work committed only to local branch, zero pushes/deploys]

---
*Next: when approved → delegate via invoke_subagent*
```

#### 2. Adhere to Teamwork Principles
- **Specify What, Not How**: Define clear interfaces, behaviors, and acceptance criteria. Avoid over-constraining the agent team with rigid implementation micro-steps unless the user specifically requested them.
- **Objective Verification**: Provide programmatic verification commands that prevent the team from prematurely self-certifying work.
- **Minimal Requirements**: Only specify constraints the user genuinely cares about, leaving room for the agents' independent problem-solving.

#### 3. Universal Execution Protocol
Once the user approves ("launch", "go", "proceed", or auto-approved):
1. Update `prompt_draft.md` status to `> Status: Launched & Executing`.
2. **For Multi-Agent Platforms (e.g. Antigravity)**:
   - If the `invoke_subagent` tool is available, delegate execution to an autonomous subagent or swarm.
   - **IMPORTANT**: In Antigravity, `teamwork_preview` is a pre-defined built-in subagent (hidden from the static subagents list). **DO NOT call `define_subagent`**. Call `invoke_subagent` directly:
     ```json
     {
       "Subagents": [
         {
           "TypeName": "teamwork_preview",
           "Role": "Teamwork Orchestrator",
           "Prompt": "<Full prompt text extracted from prompt_draft.md>",
           "Model": "inherit"
         }
       ]
     }
     ```
   - If `teamwork_preview` is not available or rejected, fall back to `TypeName: "self"` with the same prompt.
3. **For Single-Agent Harnesses (Claude Code, Cursor, Windsurf, Roo Code)**:
   - Execute the approved plan directly as an autonomous orchestrator:
     - Decompose the requirements into discrete steps.
     - Implement code changes and immediately run objective verification commands (`npm test`, `tsc`, linters).
     - Never bypass, weaken, or mock tests to achieve a passing state.
     - Provide a final verification summary listing verified vs unverified criteria.

---

## Phase 4: Reflection & Distillation Loop

Automatically execute this post-execution learning loop immediately after Phase 3 verification passes.

### Distillation Protocol:
1. **User Preferences & Interaction Overrides**:
   - If the user expressed new global preferences, tool choices, or style overrides during Phase 1, update `~/.config/grill-plan-team/user-memory.md`.
2. **Architectural Decision Records (ADRs)**:
   - Append concise entries for newly established architectural patterns or technical choices to `.grill-plan-team/project-memory.md` under `## Architectural Decision History`.
   - Format: `- [YYYY-MM-DD - Feature/Component]: [Decision summary and core rationale]`.
3. **Reviewer Lessons & Pitfall Avoidance**:
   - If regressions, failed tests, edge-case bugs, or reviewer pushbacks occurred during execution, record actionable lessons under `## Past Pitfalls & Reviewer Lessons` in `.grill-plan-team/project-memory.md`.
   - Format: `- [Pitfall Category]: [Concrete lesson and prevention heuristic]`.
4. **Bloat Prevention & Deduplication**:
   - Keep bullet points dense, actionable, and non-redundant. Merge or refine related points instead of appending duplicates.
