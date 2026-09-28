# grill-plan-team

[![CI](https://github.com/tysongoulding/grill-plan-team/actions/workflows/ci.yml/badge.svg)](https://github.com/tysongoulding/grill-plan-team/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/tysongoulding/grill-plan-team/releases)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

> **A self-contained, recursive gated workflow plugin with two-tier memory for autonomous AI coding agents:**  
> **Step 0: Memory Recall** $\to$ **Phase 1: Interactive Alignment** $\to$ **Phase 2: Technical Blueprint** $\to$ **Phase 3: Autonomous Execution** $\to$ **Phase 4: Reflection & Distillation**.  
> Fully standalone with zero external runtime dependencies.

Cross-harness plugin and installer support for **Antigravity / Gemini CLI**, **Claude Code**, **Cursor**, **Windsurf**, and **Roo Code / Cline**.

---

## The Recursive Gated Architecture

Most AI coding agents fail on complex tasks when they jump directly from a prompt into modifying code, repeating past mistakes and forgetting developer preferences. `grill-plan-team` solves this with a two-tier recursive memory architecture and four gated lifecycle phases:

```mermaid
flowchart LR
    subgraph S0["Step 0: Recall"]
        M1["Global User Memory"] --- M2["Local Project Memory"]
    end

    subgraph P1["Phase 1: Grill-Me"]
        A1["Adaptive Interview"] --> A2["Skip Known Answers"]
        A2 --> A3["Recommend with Attribution"]
    end

    subgraph P2["Phase 2: Plan"]
        B1["Ground in ADRs & Conventions"] --> B2["Write Plan Artifact"]
        B2 --> B3["Define Verification Plan"]
    end

    subgraph P3["Phase 3: Teamwork"]
        C1["Maintain Prompt Draft"] --> C2["Multi-Agent Swarm Handoff"]
        C2 --> C3["Rigorous Programmatic Verification"]
    end

    subgraph P4["Phase 4: Distill"]
        D1["Extract User Overrides"] --> D2["Append Locked ADRs"]
        D2 --> D3["Record Preventative Lessons"]
    end

    S0 --> P1
    P1 -->|"Gate 1: Architectural Alignment"| P2
    P2 -->|"Gate 2: Explicit User Approval"| P3
    P3 -->|"Gate 3: Verification Passed"| P4
    P4 -.->|"Recursively Learns"| S0
```

### Step 0: Pre-Flight Memory Recall
Before asking any questions or modifying files, the agent automatically ingests context from persistent memory across both scopes:
- **Developer Assessment (`ASSESSMENT.md`)**: Identifies personal developer persona, job role, daily duties, AI experience & proficiency level (at top), and collaboration/communication preferences.
- **Engineering Requirements (`REQUIREMENTS.md`)**: Identifies technical guardrails, VCS processes (`git`, `gh`, GitLab, Bitbucket), preferred languages, libraries, test runners, architectural decision records (ADRs), and reviewer pitfall lessons.

Ingested from local project memory (`.grill-plan-team/`) first, falling back to global user memory (`~/.config/grill-plan-team/`).

### Phase 1: Interactive Alignment (`Grill-Me`)
- **Baseline Onboarding & Rerun Trigger**: On the very first run (when baseline memory files are missing) or whenever you request an update (`re-assess`, `update preferences`, `rerun assessment`), the skill prompts for:
  1. Memory scope: Global User (`~/.config/grill-plan-team/`) or Project Local (`.grill-plan-team/`).
  2. Developer role, daily focus, and AI proficiency level.
  3. Technical guardrails, VCS process, preferred languages, and test runners.
- **Adaptive Memory Recall**: Trivial questions already resolved in memory are skipped.
- **One Question at a Time**: Avoids overwhelming the user by presenting structured multiple-choice decisions one at a time.
- **Always Recommend with Attribution**: Prefixes recommended options with `(Recommended)` and provides concise engineering rationales, explicitly citing memory when recommendations align with established preferences.
- **Walk the Decision Tree**: Systematically resolves Data models $\to$ API contract $\to$ State/Storage $\to$ CLI/UI surface $\to$ Edge cases.
- **Gate 1**: Concludes only when all architectural tradeoffs, scope boundaries, and edge cases are agreed upon.

### Phase 2: Technical Design & Verification (`Plan`)
- **Memory-Grounded Blueprint**: Builds on established project conventions and respects past architectural decisions (ADRs) and pitfall avoidance lessons.
- **Implementation Plan Artifact**: Saves a formal engineering blueprint (`<feature>_implementation_plan.md`) with:
  1. Goal Description (1–2 sentences).
  2. User Review Required (critical tradeoffs, breaking changes).
  3. Proposed Changes (files to create, modify, delete with diffs).
  4. Objective Verification Plan (exact test commands, typechecks, build commands).
- **Gate 2**: **HALT execution.** Do NOT write or modify code until the user explicitly reviews and approves the plan.

### Phase 3: Multi-Agent Swarm Handoff (`Teamwork`)
- **Prompt Draft Artifact**: Packages the approved plan into `prompt_draft.md` with behavioral requirements (R1, R2, ...) and objective acceptance criteria checkboxes.
- **Specify What, Not How**: Gives agents high-leverage boundaries without micromanaging implementation details.
- **Autonomous Delegation**: Handoffs execution to autonomous task workers (`invoke_subagent` in Antigravity or native harness subagents).
- **Rigorous Verification**: Runs objective test suites. Never weakens or deletes tests to pass. Distinguishes verified from unverified aspects.

### Phase 4: Reflection & Distillation Loop (`Distill`)
Runs autonomously immediately after Phase 3 verification passes:
1. **User Preferences**: Distills user choices and explicit overrides made during the interview into `ASSESSMENT.md` under `## Distilled User Preferences`.
2. **Architectural Decision Records (ADRs)**: Appends newly locked architectural decisions to `REQUIREMENTS.md` under `## Architectural Decision History`.
3. **Pitfall Avoidance**: Records actionable preventative lessons for bugs or edge cases uncovered during execution under `## Past Pitfalls & Reviewer Lessons`.
4. **Anti-Bloat**: Enforces concise, deduplicated bullet points so memory stays high-signal and lightweight over time.

---

## Two-Tier Memory Storage

Information is retained strictly across two files in either **Global User** or **Local Project** scope:

| Scope | Location | Primary Document | Contents |
| :--- | :--- | :--- | :--- |
| **Global User (`-user`)** | `~/.config/grill-plan-team/` | `ASSESSMENT.md` | Developer role, daily work, AI experience level (at top), collaboration style |
| **Global User (`-user`)** | `~/.config/grill-plan-team/` | `REQUIREMENTS.md` | Global guardrails, default VCS tools, preferred languages/libraries/runners |
| **Local Project (`-project`)**| `.grill-plan-team/` | `ASSESSMENT.md` | Project-specific developer persona, team contact info, collaboration style |
| **Local Project (`-project`)**| `.grill-plan-team/` | `REQUIREMENTS.md` | Repo guardrails, branching/PR workflows, tech stack, ADRs, reviewer lessons |

*Note: Existing legacy memory files (`user-memory.md` / `project-memory.md`) are automatically migrated to `ASSESSMENT.md` and `REQUIREMENTS.md` upon initial run without data loss.*

---

## Memory CLI Commands

`grill-plan-team` provides dedicated CLI commands to inspect, initialize, and re-assess memory:

```bash
# Run baseline onboarding assessment anytime (interactive or non-interactive)
npx grill-plan-team assess                   # Assesses and saves to global user scope
npx grill-plan-team assess --project         # Assesses and saves to local project scope

# Display filesystem paths to memory files
npx grill-plan-team memory path assessment --user
# => ~/.config/grill-plan-team/ASSESSMENT.md

npx grill-plan-team memory path requirements --project
# => /path/to/project/.grill-plan-team/REQUIREMENTS.md

# Initialize memory files with standard markdown sections
npx grill-plan-team memory init              # Initializes ASSESSMENT.md & REQUIREMENTS.md globally
npx grill-plan-team memory init --project    # Initializes ASSESSMENT.md & REQUIREMENTS.md locally

# View memory content directly in the terminal
npx grill-plan-team memory show assessment --user
npx grill-plan-team memory show requirements --project
```

Both `npx grill-plan-team` and `./install.sh` support these memory subcommands identically.

---

## Cross-Harness Support Matrix

| Harness | Scope | Target Path | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **Antigravity / Gemini CLI** | Global / Local | `~/.gemini/config/plugins/grill-plan-team`<br/>`rules/AGENTS.md`<br/>`skills/grill-plan-team/SKILL.md` | Skill selection, `plugin.json` registry |
| **Claude Code** | Global / Local | `~/.claude/skills/grill-plan-team/SKILL.md`<br/>`~/.claude/commands/grill-plan-team.md` | `/grill-plan-team [feature]` |
| **Cursor** | Global / Local | `~/.cursorrules`<br/>`~/.cursor/rules/grill-plan-team.mdc` | Automatic rule activation (`.cursorrules` & MDC) |
| **Windsurf** | Global / Local | `~/.windsurfrules` | Cascade auto-evaluates on planning/features |
| **Roo Code / Cline** | Global / Local | `~/.roomodes`<br/>`~/.clinerules` | Mode dropdown: **Grill-Plan-Team** |

---

## Quick-Start Installation

Zero runtime dependencies. You can install via `curl`, `npx`, or local clone:

### 1. One-Line Installer (Recommended)
Using `curl`:
```bash
curl -fsSL https://raw.githubusercontent.com/tysongoulding/grill-plan-team/main/install.sh | bash
```
Or using `wget`:
```bash
wget -qO- https://raw.githubusercontent.com/tysongoulding/grill-plan-team/main/install.sh | bash
```

### 2. Node / NPX
```bash
npx grill-plan-team
```

### 3. Local Project Installation
To install rules and adapters directly into your current project repository:
```bash
# Using install.sh
./install.sh --local .

# Or using npx
npx grill-plan-team --local .
```

*Note: Global user memory files (`ASSESSMENT.md` and `REQUIREMENTS.md`) are auto-initialized in `~/.config/grill-plan-team/` during installation if they do not already exist.*

---

## CLI Options

Both `install.sh` and `npx grill-plan-team` support identical options:

```text
Options:
  --global, -g          Install to user-level global configuration directories (default)
  --local, -l [path]    Install to project repository at [path] (default: current directory)
  --all, -a             Install to all supported harnesses regardless of host detection
  --harness <name>      Target specific harness(es): antigravity, claude, cursor, windsurf, roo
  --uninstall, -u       Cleanly remove installed grill-plan-team configurations
  --purge               Purge persistent memory files when uninstalling (protected by default)
  --dry-run, -d         Preview changes without modifying the filesystem
  --interactive         Prompt for target harnesses interactively
  --help, -h            Show help documentation
```

### User Data Protection on Uninstall

By default, `--uninstall` removes all installed harness adapters and manifests, but **protects and preserves** your persistent user and project memory files. To completely remove memory files along with the harness configurations, pass `--purge`:

```bash
# Normal uninstall (preserves ~/.config/grill-plan-team and .grill-plan-team)
npx grill-plan-team --uninstall

# Complete purge (removes harnesses and purges persistent memory files)
npx grill-plan-team --uninstall --purge
```

---

## Harness Usage

### Antigravity / Gemini CLI (`agy`)
Run your agent task normally. The agent automatically references `rules/AGENTS.md` and `skills/grill-plan-team/SKILL.md` to gate every non-trivial task through Step 0 $\to$ Phase 1 $\to$ Phase 2 $\to$ Phase 3 $\to$ Phase 4.

### Claude Code
Run the slash command:
```bash
/grill-plan-team Add OAuth2 GitHub authentication flow
```
Claude Code ingests memory, interviews you on technical choices, outputs the plan blueprint for approval, executes the teamwork phase, and distills lessons into memory.

### Cursor
Cursor automatically loads `.cursor/rules/grill-plan-team.mdc` and `.cursorrules`. Simply prompt Composer or Chat:
```text
Implement user authentication according to grill-plan-team.
```

### Windsurf
Cascade detects `.windsurfrules` and enforces the memory recall $\to$ interview $\to$ blueprint $\to$ execution $\to$ distillation lifecycle.

### Roo Code / Cline
Select the **Grill-Plan-Team** mode from the mode selector dropdown in the Roo Code UI.

---

## Development & Testing

Run the test suite:

```bash
# Verify shell installer syntax
bash -n install.sh

# Run comprehensive Node test suite (0 dependencies)
npm test
```

---

## License

[MIT](LICENSE) © 2026 Tyson Goulding
