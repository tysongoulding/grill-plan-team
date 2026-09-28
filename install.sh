#!/usr/bin/env bash
# Universal Installer for grill-plan-team
# Supports Antigravity, Claude Code, Cursor, Windsurf, and Roo Code / Cline
set -euo pipefail

GITHUB_REPO="tysongoulding/grill-plan-team"
RAW_BASE="https://raw.githubusercontent.com/${GITHUB_REPO}/main"
MANIFEST_FILE=".grill-plan-team-manifest.json"

IS_GLOBAL=1
TARGET_DIR="$HOME"
ALL_HARNESSES=0
REQUESTED_HARNESSES=()
DO_UNINSTALL=0
DO_PURGE=0
DRY_RUN=0
INTERACTIVE=0
declare -a INSTALLED_FILES=()

# Determine script directory if run from local filesystem
SCRIPT_SOURCE="${BASH_SOURCE[0]:-}"
if [ -n "$SCRIPT_SOURCE" ] && [ -f "$SCRIPT_SOURCE" ]; then
  REPO_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
else
  REPO_DIR=""
fi

# Normalize path resolving . and .. without requiring directory to exist
normalize_path() {
  local p="${1:-}"
  p="${p#"${p%%[![:space:]]*}"}"
  p="${p%"${p##*[![:space:]]}"}"
  if [ -z "$p" ] || [ "$p" = "." ]; then
    pwd
    return 0
  fi
  if [[ "$p" != /* ]]; then
    p="$(pwd)/$p"
  fi
  local IFS="/"
  read -ra parts <<< "$p"
  local res=()
  for part in "${parts[@]}"; do
    if [ -z "$part" ] || [ "$part" = "." ]; then
      continue
    elif [ "$part" = ".." ]; then
      if [ ${#res[@]} -gt 0 ]; then
        unset "res[${#res[@]}-1]"
      fi
    else
      res+=("$part")
    fi
  done
  local out=""
  for part in "${res[@]}"; do
    out="${out}/${part}"
  done
  echo "${out:-/}"
}

# Fetch or read file content
get_file_content() {
  local rel_path="$1"
  if [ -n "$REPO_DIR" ] && [ -f "$REPO_DIR/templates/$rel_path" ]; then
    cat "$REPO_DIR/templates/$rel_path"
  elif [ -n "$REPO_DIR" ] && [ -f "$REPO_DIR/$rel_path" ]; then
    cat "$REPO_DIR/$rel_path"
  else
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "${RAW_BASE}/templates/${rel_path}" 2>/dev/null || curl -fsSL "${RAW_BASE}/${rel_path}"
    elif command -v wget >/dev/null 2>&1; then
      wget -qO- "${RAW_BASE}/templates/${rel_path}" 2>/dev/null || wget -qO- "${RAW_BASE}/${rel_path}"
    else
      echo "Error: neither curl nor wget available to fetch ${rel_path}" >&2
      exit 1
    fi
  fi
}

get_memory_template() {
  local kind="$1"
  local content=""
  local filename="${kind}.md"
  if [ "$kind" = "user" ] || [ "$kind" = "project" ]; then
    filename="${kind}-memory.md"
  elif [ "$kind" = "assessment" ]; then
    filename="ASSESSMENT.md"
  elif [ "$kind" = "requirements" ]; then
    filename="REQUIREMENTS.md"
  fi

  if [ -n "$REPO_DIR" ] && [ -f "$REPO_DIR/templates/memory/${filename}" ]; then
    cat "$REPO_DIR/templates/memory/${filename}"
    return
  fi
  if command -v curl >/dev/null 2>&1; then
    content="$(curl -fsSL "${RAW_BASE}/templates/memory/${filename}" 2>/dev/null || true)"
  elif command -v wget >/dev/null 2>&1; then
    content="$(wget -qO- "${RAW_BASE}/templates/memory/${filename}" 2>/dev/null || true)"
  fi
  if [ -n "$content" ]; then
    printf "%s\n" "$content"
    return
  fi

  if [ "$kind" = "assessment" ] || [ "$kind" = "user" ]; then
    cat << 'EOF'
# Developer Assessment & Baseline Profile (grill-plan-team)

Baseline assessment of developer role, daily work, AI experience level, and preferred collaboration style.

## Developer Role & Daily Work
- Primary role: Software Engineer / Architect.
- Daily responsibilities: Full-stack system development, modular architecture, and autonomous workflow design.
- Target domains: Developer tooling, agentic pipelines, cross-platform CLI applications.

## AI Experience & Proficiency
- AI proficiency level: Advanced / Power User.
- Primary coding agent use cases: Automated refactoring, architecture design alignment, multi-agent swarm execution.
- Guidance style: Provide clear architectural requirements and objective verification; avoid micromanaging low-level implementation details.

## Activation & Trigger Preference
- Trigger mode: Automatic (LLM determines when to invoke on non-trivial features/architectural changes).
- Fallback: Can always be explicitly invoked with `/grill-plan-team` or chat prompt.

## Collaboration & Communication Style
- Preferred interaction cadence: Direct, concise, technical rationale first.
- Decision format: Present structured multiple-choice recommendations with explicit trade-offs and citations.
- Explanations: Keep UI options concise; provide expanded technical deep dives when requested.

## Distilled User Preferences
- Learned interaction habits: Prefers automated verification prior to certification.
- Workflow feedback: Value clean commits, high cohesion, and zero unnecessary dependencies.
EOF
  else
    cat << 'EOF'
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
- [Initial Bootstrap]: Established unified 4-phase gated pipeline with cross-harness parity.

## Past Pitfalls & Reviewer Lessons
- Parity requirement: Any CLI or template change must be mirrored across both `bin/install.js` and `install.sh`.
- Path normalization: Always resolve paths and trim whitespace when handling user inputs.
- Cross-harness compatibility: Do not bind phase execution to proprietary subagent names.
EOF
  fi
}

print_memory_help() {
  cat << 'EOF'
Grill-Plan-Team Two-Tier Memory CLI

Usage:
  ./install.sh memory init [assessment | requirements] [--project | --user]
  ./install.sh memory show [assessment | requirements] [--project | --user]
  ./install.sh memory path [assessment | requirements] [--project | --user]
  ./install.sh assess [--project | --user]

Options:
  --user, -u          Target global user memory (~/.config/grill-plan-team/) (default)
  --project, -p       Target local project memory (.grill-plan-team/)
  --local, -l [path]  Target specific project directory for --project
  --force, -f         Force overwrite of existing memory file on init
  --help, -h          Show this help message
EOF
}

# Handle assess command if requested
if [ "${1:-}" = "assess" ]; then
  shift
  assess_target="user"
  assess_local_path=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --user|-u|--user-global)
        assess_target="user"
        shift
        ;;
      --project|-p|--per-project)
        assess_target="project"
        shift
        ;;
      --local|-l)
        if [ $# -gt 1 ] && [[ "$2" != -* ]]; then
          assess_local_path="$(normalize_path "$2")"
          shift 2
        else
          assess_local_path="$(pwd)"
          shift
        fi
        ;;
      *)
        shift
        ;;
    esac
  done

  a_home="${HOME%/}"
  a_base="${assess_local_path:-$(pwd)}"
  a_base="${a_base%/}"
  xdg_conf="${XDG_CONFIG_HOME:-$a_home/.config}"
  xdg_conf="${xdg_conf%/}"

  if [ "$assess_target" = "project" ]; then
    out_dir="${a_base}/.grill-plan-team"
  else
    out_dir="${xdg_conf}/grill-plan-team"
  fi

  if [ -t 0 ]; then
    echo "=== Grill-Plan-Team Baseline Assessment ==="
    echo ""
    read -r -p "Where should preferences be saved? [1] User global (~/.config/grill-plan-team) [2] Project local (.grill-plan-team) [Default: 1]: " scope_ans
    if [ "$scope_ans" = "2" ]; then
      assess_target="project"
      out_dir="${a_base}/.grill-plan-team"
    fi
    read -r -p "Developer role and daily focus [Default: Software Engineer / Architect]: " role_ans
    role_ans="${role_ans:-Software Engineer / Architect}"
    read -r -p "Experience level with AI coding (Beginner / Intermediate / Advanced / Power User) [Default: Power User]: " ai_ans
    ai_ans="${ai_ans:-Power User}"
    read -r -p "Trigger mode: [1] Automatic (LLM decides when to invoke) [2] Explicit only (only run when requested) [Default: 1]: " trigger_ans
    if [ "$trigger_ans" = "2" ]; then
      trigger_mode="Explicit only (only run when explicitly invoked)"
    else
      trigger_mode="Automatic (LLM determines when to invoke on non-trivial features/architectural changes)"
    fi
    read -r -p "Key guardrails & constraints [Default: Zero runtime dependencies, non-breaking changes, test integrity]: " guard_ans
    guard_ans="${guard_ans:-Zero runtime dependencies, non-breaking changes, test integrity}"
    read -r -p "Preferred VCS tool & remote workflow [Default: GitHub CLI gh and standard git]: " vcs_ans
    vcs_ans="${vcs_ans:-GitHub CLI gh and standard git}"
    read -r -p "Preferred languages and test runner [Default: TypeScript, Node.js LTS, native node:test]: " lang_ans
    lang_ans="${lang_ans:-TypeScript, Node.js LTS, native node:test}"

    mkdir -p "$out_dir"
    cat > "$out_dir/ASSESSMENT.md" << EOF
# Developer Assessment & Baseline Profile (grill-plan-team)

Baseline assessment of developer role, daily work, AI experience level, and preferred collaboration style.

## Developer Role & Daily Work
- Primary role: ${role_ans}.
- Daily responsibilities: Full-stack system development, modular architecture, and autonomous workflow design.

## AI Experience & Proficiency
- AI proficiency level: ${ai_ans}.
- Primary coding agent use cases: Automated refactoring, architecture design alignment, multi-agent swarm execution.
- Guidance style: Provide clear architectural requirements and objective verification; avoid micromanaging low-level implementation details.

## Activation & Trigger Preference
- Trigger mode: ${trigger_mode}.
- Fallback: Can always be explicitly invoked with \`/grill-plan-team\` or chat prompt.

## Collaboration & Communication Style
- Preferred interaction cadence: Direct, concise, technical rationale first.
- Decision format: Present structured multiple-choice recommendations with explicit trade-offs and citations.

## Distilled User Preferences
- Learned interaction habits: Prefers automated verification prior to certification.
EOF

    cat > "$out_dir/REQUIREMENTS.md" << EOF
# Engineering Requirements & Technical Guardrails (grill-plan-team)

Technical guardrails, VCS workflows, language and library preferences, architectural records, and reviewer lessons.

## Guardrails & Safety
- Guardrails: ${guard_ans}.
- Test integrity: Never bypass, weaken, skip, or mock tests to achieve a passing state.

## VCS & Repository Processes
- Preferred VCS tool: ${vcs_ans}.
- Remote providers: GitHub (primary), GitLab, Bitbucket.
- Branching & commits: Clean commit messages following conventional commits; local verification before push.

## Preferred Languages & Runtimes
- Primary languages & runtimes: ${lang_ans}.
- Typing: Strict TypeScript compilation with noEmit type checking where applicable.

## Architectural Decision History
- [Initial Baseline]: Established baseline developer requirements.

## Past Pitfalls & Reviewer Lessons
- Verification first: Run objective programmatic tests before completing tasks.
EOF

    echo ""
    echo "Baseline assessment saved successfully!"
    echo "- $out_dir/ASSESSMENT.md"
    echo "- $out_dir/REQUIREMENTS.md"
    exit 0
  fi

  mkdir -p "$out_dir"
  assess_content="$(get_memory_template "assessment")"
  req_content="$(get_memory_template "requirements")"
  printf "%s\n" "$assess_content" > "$out_dir/ASSESSMENT.md"
  printf "%s\n" "$req_content" > "$out_dir/REQUIREMENTS.md"
  echo "[assess] Baseline memory initialized in $assess_target scope:"
  echo "- $out_dir/ASSESSMENT.md"
  echo "- $out_dir/REQUIREMENTS.md"
  exit 0
fi

# Handle memory subcommand if requested
if [ "${1:-}" = "memory" ]; then
  shift
  subcmd="${1:-}"
  if [ -z "$subcmd" ] || [ "$subcmd" = "--help" ] || [ "$subcmd" = "-h" ]; then
    print_memory_help
    exit 0
  fi
  shift

  doc_type=""
  if [ "${1:-}" = "assessment" ] || [ "${1:-}" = "assess" ] || [ "${1:-}" = "profile" ]; then
    doc_type="assessment"
    shift
  elif [ "${1:-}" = "requirements" ] || [ "${1:-}" = "req" ] || [ "${1:-}" = "guardrails" ]; then
    doc_type="requirements"
    shift
  elif [ "${1:-}" = "legacy" ]; then
    doc_type="legacy"
    shift
  fi

  mem_target="user"
  mem_local_path=""
  mem_force=0

  while [ $# -gt 0 ]; do
    case "$1" in
      --user|-u|-user|--user-global|-user-global)
        mem_target="user"
        shift
        ;;
      --project|-p|--per-project|-project|-per-project)
        mem_target="project"
        shift
        ;;
      --force|-f)
        mem_force=1
        shift
        ;;
      --local|-l)
        if [ $# -gt 1 ] && [[ "$2" != -* ]]; then
          mem_local_path="$(normalize_path "$2")"
          shift 2
        else
          mem_local_path="$(pwd)"
          shift
        fi
        ;;
      --local=*|-l=*)
        raw_val="${1#*=}"
        mem_local_path="$(normalize_path "$raw_val")"
        shift
        ;;
      --help|-h)
        print_memory_help
        exit 0
        ;;
      *)
        echo "Error: Unknown option for memory $subcmd: $1" >&2
        print_memory_help
        exit 1
        ;;
    esac
  done

  mem_home="${HOME%/}"
  mem_base="${mem_local_path:-$(pwd)}"
  mem_base="${mem_base%/}"
  xdg_conf="${XDG_CONFIG_HOME:-$mem_home/.config}"
  xdg_conf="${xdg_conf%/}"

  case "$subcmd" in
    path)
      if [ "$doc_type" = "assessment" ]; then
        if [ "$mem_target" = "project" ]; then
          echo "${mem_base}/.grill-plan-team/ASSESSMENT.md"
        else
          echo "${xdg_conf}/grill-plan-team/ASSESSMENT.md"
        fi
      elif [ "$doc_type" = "requirements" ]; then
        if [ "$mem_target" = "project" ]; then
          echo "${mem_base}/.grill-plan-team/REQUIREMENTS.md"
        else
          echo "${xdg_conf}/grill-plan-team/REQUIREMENTS.md"
        fi
      elif [ "$doc_type" = "legacy" ]; then
        if [ "$mem_target" = "project" ]; then
          echo "${mem_base}/.grill-plan-team/project-memory.md"
        else
          echo "${xdg_conf}/grill-plan-team/user-memory.md"
        fi
      else
        if [ "$mem_target" = "project" ]; then
          echo "${mem_base}/.grill-plan-team/REQUIREMENTS.md"
        else
          echo "${xdg_conf}/grill-plan-team/ASSESSMENT.md"
        fi
      fi
      exit 0
      ;;
    init)
      if [ "$mem_target" = "project" ]; then
        config_dir="${mem_base}/.grill-plan-team"
        mkdir -p "$config_dir"
        
        # Auto-migrate legacy if exists
        if [ -f "$config_dir/project-memory.md" ]; then
          if [ ! -f "$config_dir/REQUIREMENTS.md" ]; then
            printf "%s\n" "$(get_memory_template "requirements")" > "$config_dir/REQUIREMENTS.md"
          fi
          if [ ! -f "$config_dir/ASSESSMENT.md" ]; then
            printf "%s\n" "$(get_memory_template "assessment")" > "$config_dir/ASSESSMENT.md"
          fi
        fi

        if [ "$doc_type" = "assessment" ]; then
          files_to_init=("$config_dir/ASSESSMENT.md:assessment")
        elif [ "$doc_type" = "requirements" ]; then
          files_to_init=("$config_dir/REQUIREMENTS.md:requirements")
        else
          files_to_init=("$config_dir/ASSESSMENT.md:assessment" "$config_dir/REQUIREMENTS.md:requirements")
        fi

        for item in "${files_to_init[@]}"; do
          target_file="${item%:*}"
          kind="${item##*:}"
          if [ -d "$target_file" ]; then
            echo "Error: Cannot initialize memory because a directory exists at $target_file." >&2
            exit 1
          fi
          if [ -f "$target_file" ] && [ "$mem_force" -eq 0 ]; then
            echo "Project memory already exists at: $target_file"
          else
            content="$(get_memory_template "$kind")"
            mkdir -p "$(dirname "$target_file")"
            printf "%s\n" "$content" > "$target_file"
            echo "Initialized project memory: $target_file"
          fi
        done
      else
        config_dir="${xdg_conf}/grill-plan-team"
        mkdir -p "$config_dir"

        # Auto-migrate legacy if exists
        if [ -f "$config_dir/user-memory.md" ]; then
          if [ ! -f "$config_dir/ASSESSMENT.md" ]; then
            printf "%s\n" "$(get_memory_template "assessment")" > "$config_dir/ASSESSMENT.md"
          fi
          if [ ! -f "$config_dir/REQUIREMENTS.md" ]; then
            printf "%s\n" "$(get_memory_template "requirements")" > "$config_dir/REQUIREMENTS.md"
          fi
        fi

        if [ "$doc_type" = "assessment" ]; then
          files_to_init=("$config_dir/ASSESSMENT.md:assessment")
        elif [ "$doc_type" = "requirements" ]; then
          files_to_init=("$config_dir/REQUIREMENTS.md:requirements")
        else
          files_to_init=("$config_dir/ASSESSMENT.md:assessment" "$config_dir/REQUIREMENTS.md:requirements")
        fi

        for item in "${files_to_init[@]}"; do
          target_file="${item%:*}"
          kind="${item##*:}"
          if [ -d "$target_file" ]; then
            echo "Error: Cannot initialize memory because a directory exists at $target_file." >&2
            exit 1
          fi
          if [ -f "$target_file" ] && [ "$mem_force" -eq 0 ]; then
            echo "User memory already exists at: $target_file"
          else
            content="$(get_memory_template "$kind")"
            mkdir -p "$(dirname "$target_file")"
            printf "%s\n" "$content" > "$target_file"
            echo "Initialized user memory: $target_file"
          fi
        done
      fi
      exit 0
      ;;
    show)
      if [ "$doc_type" = "assessment" ]; then
        target_file="$([ "$mem_target" = "project" ] && echo "${mem_base}/.grill-plan-team/ASSESSMENT.md" || echo "${xdg_conf}/grill-plan-team/ASSESSMENT.md")"
      elif [ "$doc_type" = "requirements" ]; then
        target_file="$([ "$mem_target" = "project" ] && echo "${mem_base}/.grill-plan-team/REQUIREMENTS.md" || echo "${xdg_conf}/grill-plan-team/REQUIREMENTS.md")"
      else
        target_file="$([ "$mem_target" = "project" ] && echo "${mem_base}/.grill-plan-team/REQUIREMENTS.md" || echo "${xdg_conf}/grill-plan-team/ASSESSMENT.md")"
      fi

      if [ ! -f "$target_file" ]; then
        # Fall back to legacy if present
        legacy_file="$([ "$mem_target" = "project" ] && echo "${mem_base}/.grill-plan-team/project-memory.md" || echo "${xdg_conf}/grill-plan-team/user-memory.md")"
        if [ -f "$legacy_file" ]; then
          target_file="$legacy_file"
        else
          echo "Error: $([ "$mem_target" = "project" ] && echo "Project" || echo "User") memory file not found at $target_file." >&2
          exit 1
        fi
      fi
      cat "$target_file"
      exit 0
      ;;
    *)
      echo "Error: Unknown memory subcommand: $subcmd" >&2
      print_memory_help
      exit 1
      ;;
  esac
fi

print_help() {
  cat << 'EOF'
Grill-Plan-Team Universal Shell Installer

Usage:
  ./install.sh [options]
  ./install.sh memory <subcommand> [options]
  curl -fsSL https://raw.githubusercontent.com/tysongoulding/grill-plan-team/main/install.sh | bash -s -- [options]

Options:
  --global, -g          Install to user-level global configuration directories (default)
  --local, -l [path]    Install to project repository at [path] (default: current directory)
  --all, -a             Install to all supported harnesses regardless of host detection
  --harness <name>      Target specific harness(es): antigravity, claude, cursor, windsurf, roo
  --uninstall, -u       Cleanly remove installed grill-plan-team configurations
  --purge               Purge persistent memory files when uninstalling
  --dry-run, -d         Preview changes without modifying the filesystem
  --interactive         Prompt for target harnesses interactively
  --help, -h            Show this help documentation

Memory Commands:
  ./install.sh memory init [--project | --user]
  ./install.sh memory show [--project | --user]
  ./install.sh memory path [--project | --user]

Supported Harnesses:
  * antigravity   Antigravity / Gemini CLI (~/.gemini/config/plugins/grill-plan-team)
  * claude        Claude Code (~/.claude/skills and ~/.claude/commands)
  * cursor        Cursor (.cursorrules and .cursor/rules/grill-plan-team.mdc)
  * windsurf      Windsurf Cascade (.windsurfrules)
  * roo           Roo Code / Cline (.roomodes and .clinerules)
EOF
}

# Parse command line arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h)
      print_help
      exit 0
      ;;
    --global|-g)
      IS_GLOBAL=1
      TARGET_DIR="$HOME"
      shift
      ;;
    --local|-l)
      IS_GLOBAL=0
      if [ $# -gt 1 ] && [[ "$2" != -* ]]; then
        TARGET_DIR="$(normalize_path "$2")"
        mkdir -p "$TARGET_DIR" 2>/dev/null || true
        shift 2
      else
        TARGET_DIR="$(pwd)"
        shift
      fi
      ;;
    --local=*|-l=*)
      IS_GLOBAL=0
      raw_val="${1#*=}"
      TARGET_DIR="$(normalize_path "$raw_val")"
      mkdir -p "$TARGET_DIR" 2>/dev/null || true
      shift
      ;;
    --all|-a)
      ALL_HARNESSES=1
      shift
      ;;
    --uninstall|-u)
      DO_UNINSTALL=1
      shift
      ;;
    --purge)
      DO_PURGE=1
      shift
      ;;
    --dry-run|-d)
      DRY_RUN=1
      shift
      ;;
    --interactive)
      INTERACTIVE=1
      shift
      ;;
    --harness)
      if [ $# -gt 1 ] && [[ "$2" != -* ]]; then
        raw_val="$2"
        trimmed_check="$(echo "$raw_val" | tr -d '[:space:]')"
        if [ -z "$trimmed_check" ]; then
          echo "Error: --harness requires an argument." >&2
          exit 1
        fi
        IFS=',' read -ra ADDR <<< "$raw_val"
        for i in "${ADDR[@]}"; do
          cleaned="$(echo "$i" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
          if [ -n "$cleaned" ]; then
            REQUESTED_HARNESSES+=("$cleaned")
          fi
        done
        shift 2
      else
        echo "Error: --harness requires an argument." >&2
        exit 1
      fi
      ;;
    --harness=*)
      val="${1#*=}"
      trimmed_check="$(echo "$val" | tr -d '[:space:]')"
      if [ -z "$trimmed_check" ]; then
        echo "Error: --harness requires an argument." >&2
        exit 1
      fi
      IFS=',' read -ra ADDR <<< "$val"
      for i in "${ADDR[@]}"; do
        cleaned="$(echo "$i" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
        if [ -n "$cleaned" ]; then
          REQUESTED_HARNESSES+=("$cleaned")
        fi
      done
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      print_help
      exit 1
      ;;
  esac
done

# Ensure TARGET_DIR is non-empty
if [ -z "$TARGET_DIR" ]; then
  TARGET_DIR="$(pwd)"
fi

# Normalize and validate requested harnesses if specified
VALID_REQUESTED_HARNESSES=()
if [ ${#REQUESTED_HARNESSES[@]} -gt 0 ]; then
  for h in "${REQUESTED_HARNESSES[@]}"; do
    cleaned_h="$(echo "$h" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
    case "$cleaned_h" in
      antigravity|gemini|agy)
        if [[ ! " ${VALID_REQUESTED_HARNESSES[*]:-} " =~ " antigravity " ]]; then
          VALID_REQUESTED_HARNESSES+=("antigravity")
        fi
        ;;
      claude|claude-code)
        if [[ ! " ${VALID_REQUESTED_HARNESSES[*]:-} " =~ " claude " ]]; then
          VALID_REQUESTED_HARNESSES+=("claude")
        fi
        ;;
      cursor)
        if [[ ! " ${VALID_REQUESTED_HARNESSES[*]:-} " =~ " cursor " ]]; then
          VALID_REQUESTED_HARNESSES+=("cursor")
        fi
        ;;
      windsurf)
        if [[ ! " ${VALID_REQUESTED_HARNESSES[*]:-} " =~ " windsurf " ]]; then
          VALID_REQUESTED_HARNESSES+=("windsurf")
        fi
        ;;
      roo|cline|roo-code)
        if [[ ! " ${VALID_REQUESTED_HARNESSES[*]:-} " =~ " roo " ]]; then
          VALID_REQUESTED_HARNESSES+=("roo")
        fi
        ;;
      *) echo "Warning: Unknown harness '$h' ignored." >&2 ;;
    esac
  done
  if [ ${#VALID_REQUESTED_HARNESSES[@]} -eq 0 ]; then
    echo "Error: No valid harnesses specified. Choose from: antigravity, claude, cursor, windsurf, roo" >&2
    exit 1
  fi
fi

# Detection functions
has_antigravity() {
  [ -d "$HOME/.gemini" ] || command -v agy >/dev/null 2>&1 || command -v gemini >/dev/null 2>&1
}

has_claude() {
  [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1
}

has_cursor() {
  [ -d "$HOME/.cursor" ] || [ -f "$HOME/.cursorrules" ] || command -v cursor >/dev/null 2>&1
}

has_windsurf() {
  [ -f "$HOME/.windsurfrules" ] || [ -d "$HOME/.codeium/windsurf" ] || command -v windsurf >/dev/null 2>&1
}

has_roo() {
  [ -f "$HOME/.roomodes" ] || [ -f "$HOME/.clinerules" ] || [ -d "$HOME/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline" ]
}

write_file_safe() {
  local target_path="$1"
  local content="$2"
  local target_dir
  target_dir="$(dirname "$target_path")"

  if [ -z "$content" ]; then
    echo "Error: retrieved empty content for $target_path" >&2
    exit 1
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] Would write: $target_path"
  else
    mkdir -p "$target_dir"
    printf "%s\n" "$content" > "$target_path"
    echo "Created: $target_path"
    INSTALLED_FILES+=("$target_path")
  fi
}

# Unregister / Register in ~/.gemini/config/plugins.json
update_plugins_json() {
  local plugins_file="$1/.gemini/config/plugins.json"
  local plugin_path="$1/.gemini/config/plugins/grill-plan-team"
  local mode="$2" # "add" or "remove"

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] Would update $plugins_file ($mode)"
    return
  fi

  if [ "$mode" = "remove" ]; then
    if [ -f "$plugins_file" ]; then
      if command -v node >/dev/null 2>&1; then
        node -e '
          const fs = require("fs");
          const p = process.argv[1];
          try {
            const data = JSON.parse(fs.readFileSync(p, "utf8"));
            if (Array.isArray(data.entries)) {
              data.entries = data.entries.filter(e => !e || !e.path || !e.path.endsWith("/grill-plan-team"));
              fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
            }
          } catch {}
        ' "$plugins_file"
      elif grep -q "grill-plan-team" "$plugins_file" 2>/dev/null; then
        grep -v "grill-plan-team" "$plugins_file" > "${plugins_file}.tmp" && mv "${plugins_file}.tmp" "$plugins_file"
      fi
      echo "[plugins.json] Unregistered grill-plan-team from $plugins_file"
    fi
    return
  fi

  # Add mode
  mkdir -p "$(dirname "$plugins_file")"
  if [ -f "$plugins_file" ]; then
    if command -v node >/dev/null 2>&1; then
      node -e '
        const fs = require("fs");
        const p = process.argv[1];
        const target = process.argv[2];
        let data = { entries: [] };
        try {
          data = JSON.parse(fs.readFileSync(p, "utf8"));
          if (!Array.isArray(data.entries)) data.entries = [];
        } catch {}
        if (!data.entries.some(e => e && e.path === target)) {
          data.entries.push({ path: target });
          fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
        }
      ' "$plugins_file" "$plugin_path"
    else
      if ! grep -q "$plugin_path" "$plugins_file" 2>/dev/null; then
        cat > "$plugins_file" << EOF
{
  "entries": [
    {
      "path": "$plugin_path"
    }
  ]
}
EOF
      fi
    fi
  else
    cat > "$plugins_file" << EOF
{
  "entries": [
    {
      "path": "$plugin_path"
    }
  ]
}
EOF
  fi
  echo "[plugins.json] Registered grill-plan-team in $plugins_file"
}

update_manifest_on_uninstall() {
  local manifest_path="$1"
  shift
  local uninstalled_harnesses=("$@")

  if [ "$DRY_RUN" -eq 1 ] || [ ! -f "$manifest_path" ]; then
    return
  fi

  if command -v node >/dev/null 2>&1; then
    local harnesses_json
    local files_json
    harnesses_json="$(node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "${uninstalled_harnesses[@]}")"
    files_json="$(node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "${UNINSTALL_FILES[@]}")"
    node -e '
      const fs = require("fs");
      const mPath = process.argv[1];
      const uninstalledHarnesses = JSON.parse(process.argv[2]);
      const removedFiles = new Set(JSON.parse(process.argv[3]));
      try {
        const manifest = JSON.parse(fs.readFileSync(mPath, "utf8"));
        const remainingHarnesses = (manifest.harnesses || []).filter(h => !uninstalledHarnesses.includes(h));
        const remainingFiles = (manifest.installedFiles || []).filter(f => !removedFiles.has(f));
        if (remainingHarnesses.length === 0 || remainingFiles.length === 0) {
          fs.unlinkSync(mPath);
        } else {
          manifest.installedFiles = remainingFiles;
          manifest.harnesses = remainingHarnesses;
          manifest.updatedAt = new Date().toISOString();
          fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2) + "\n");
        }
      } catch {
        try { fs.unlinkSync(mPath); } catch {}
      }
    ' "$manifest_path" "$harnesses_json" "$files_json"
  else
    if [ ${#VALID_REQUESTED_HARNESSES[@]} -eq 0 ]; then
      rm -f "$manifest_path"
    else
      local rem_harnesses=()
      local rem_files=()
      for eh in antigravity claude cursor windsurf roo; do
        if grep -q "\"$eh\"" "$manifest_path"; then
          local keep=1
          for uh in "${uninstalled_harnesses[@]}"; do
            if [ "$eh" = "$uh" ]; then keep=0; break; fi
          done
          if [ "$keep" -eq 1 ]; then rem_harnesses+=("$eh"); fi
        fi
      done
      while IFS= read -r f; do
        if [ -n "$f" ]; then
          local keep=1
          for rf in "${UNINSTALL_FILES[@]}"; do
            if [ "$f" = "$rf" ]; then keep=0; break; fi
          done
          if [ "$keep" -eq 1 ]; then rem_files+=("$f"); fi
        fi
      done < <(grep -o '"/[^"]*"' "$manifest_path" | tr -d '"')

      if [ ${#rem_harnesses[@]} -eq 0 ] || [ ${#rem_files[@]} -eq 0 ]; then
        rm -f "$manifest_path"
      else
        local files_str
        local harnesses_str
        files_str="$(printf '    "%s",\n' "${rem_files[@]}" | sed '$ s/,$//')"
        harnesses_str="$(printf '    "%s",\n' "${rem_harnesses[@]}" | sed '$ s/,$//')"
        cat > "$manifest_path" << EOF
{
  "installedFiles": [
$files_str
  ],
  "harnesses": [
$harnesses_str
  ],
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0"
}
EOF
      fi
    fi
  fi
}

save_installation_manifest() {
  local manifest_path="$1"

  if [ "$DRY_RUN" -eq 1 ]; then
    return
  fi

  if command -v node >/dev/null 2>&1; then
    local new_files_json
    local new_harnesses_json
    new_files_json="$(node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "${INSTALLED_FILES[@]}")"
    new_harnesses_json="$(node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "${SELECTED_HARNESSES[@]}")"
    node -e '
      const fs = require("fs");
      const mPath = process.argv[1];
      const newFiles = JSON.parse(process.argv[2]);
      const newHarnesses = JSON.parse(process.argv[3]);
      let manifest = { installedFiles: [], harnesses: [] };
      if (fs.existsSync(mPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(mPath, "utf8"));
          if (!Array.isArray(manifest.installedFiles)) manifest.installedFiles = [];
          if (!Array.isArray(manifest.harnesses)) manifest.harnesses = [];
        } catch {}
      }
      const filesSet = new Set([...manifest.installedFiles, ...newFiles]);
      const harnessesSet = new Set([...manifest.harnesses, ...newHarnesses]);
      manifest.installedFiles = Array.from(filesSet);
      manifest.harnesses = Array.from(harnessesSet);
      manifest.updatedAt = new Date().toISOString();
      manifest.version = "1.0.0";
      fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2) + "\n");
    ' "$manifest_path" "$new_files_json" "$new_harnesses_json"
  else
    local all_files=("${INSTALLED_FILES[@]}")
    local all_harnesses=("${SELECTED_HARNESSES[@]}")
    if [ -f "$manifest_path" ]; then
      while IFS= read -r f; do
        if [ -n "$f" ]; then
          local already=0
          for af in "${all_files[@]}"; do if [ "$af" = "$f" ]; then already=1; break; fi; done
          if [ "$already" -eq 0 ]; then all_files+=("$f"); fi
        fi
      done < <(grep -o '"/[^"]*"' "$manifest_path" | tr -d '"')
      for h in antigravity claude cursor windsurf roo; do
        if grep -q "\"$h\"" "$manifest_path"; then
          local already=0
          for ah in "${all_harnesses[@]}"; do if [ "$ah" = "$h" ]; then already=1; break; fi; done
          if [ "$already" -eq 0 ]; then all_harnesses+=("$h"); fi
        fi
      done
    fi
    local files_str
    local harnesses_str
    if [ ${#all_files[@]} -gt 0 ]; then
      files_str="$(printf '    "%s",\n' "${all_files[@]}" | sed '$ s/,$//')"
    else
      files_str=""
    fi
    if [ ${#all_harnesses[@]} -gt 0 ]; then
      harnesses_str="$(printf '    "%s",\n' "${all_harnesses[@]}" | sed '$ s/,$//')"
    else
      harnesses_str=""
    fi

    cat > "$manifest_path" << EOF
{
  "installedFiles": [
$files_str
  ],
  "harnesses": [
$harnesses_str
  ],
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0"
}
EOF
  fi
}

MANIFEST_PATH="${TARGET_DIR}/${MANIFEST_FILE}"

if [ "$DO_UNINSTALL" -eq 1 ]; then
  echo "=== Uninstalling grill-plan-team from ${TARGET_DIR} ==="
  declare -a UNINSTALL_HARNESSES=()
  if [ ${#VALID_REQUESTED_HARNESSES[@]} -gt 0 ]; then
    UNINSTALL_HARNESSES=("${VALID_REQUESTED_HARNESSES[@]}")
  else
    UNINSTALL_HARNESSES=("antigravity" "claude" "cursor" "windsurf" "roo")
  fi

  declare -a UNINSTALL_FILES=()

  for h in "${UNINSTALL_HARNESSES[@]}"; do
    case "$h" in
      antigravity)
        if [ "$IS_GLOBAL" -eq 1 ]; then
          UNINSTALL_FILES+=(
            "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/plugin.json"
            "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/rules/AGENTS.md"
            "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/skills/grill-plan-team/SKILL.md"
            "${TARGET_DIR}/.gemini/config/skills/grill-plan-team/SKILL.md"
          )
        else
          UNINSTALL_FILES+=(
            "${TARGET_DIR}/plugin.json"
            "${TARGET_DIR}/rules/AGENTS.md"
            "${TARGET_DIR}/skills/grill-plan-team/SKILL.md"
          )
        fi
        ;;
      claude)
        UNINSTALL_FILES+=(
          "${TARGET_DIR}/.claude/skills/grill-plan-team/SKILL.md"
          "${TARGET_DIR}/.claude/commands/grill-plan-team.md"
        )
        ;;
      cursor)
        UNINSTALL_FILES+=(
          "${TARGET_DIR}/.cursor/rules/grill-plan-team.mdc"
          "${TARGET_DIR}/.cursorrules"
        )
        ;;
      windsurf)
        UNINSTALL_FILES+=(
          "${TARGET_DIR}/.windsurfrules"
        )
        ;;
      roo)
        UNINSTALL_FILES+=(
          "${TARGET_DIR}/.roomodes"
          "${TARGET_DIR}/.clinerules"
        )
        ;;
    esac
  done

  REMOVED_COUNT=0
  for f in "${UNINSTALL_FILES[@]}"; do
    if [ -f "$f" ]; then
      if [ "$DRY_RUN" -eq 1 ]; then
        echo "[dry-run] Would remove: $f"
      else
        rm -f "$f"
        echo "Removed: $f"
        REMOVED_COUNT=$((REMOVED_COUNT + 1))
      fi
    fi
  done

  if [ "$DO_PURGE" -eq 1 ] && [ "$DRY_RUN" -eq 1 ]; then
    if [ "$IS_GLOBAL" -eq 1 ]; then
      t_dir="${TARGET_DIR%/}"
      xdg_conf="${XDG_CONFIG_HOME:-$t_dir/.config}"
      for pf in "${xdg_conf%/}/grill-plan-team/ASSESSMENT.md" "${xdg_conf%/}/grill-plan-team/REQUIREMENTS.md" "${xdg_conf%/}/grill-plan-team/user-memory.md"; do
        if [ -f "$pf" ]; then
          echo "[dry-run] Would purge: $pf"
        fi
      done
    else
      for pf in "${TARGET_DIR%/}/.grill-plan-team/ASSESSMENT.md" "${TARGET_DIR%/}/.grill-plan-team/REQUIREMENTS.md" "${TARGET_DIR%/}/.grill-plan-team/project-memory.md"; do
        if [ -f "$pf" ]; then
          echo "[dry-run] Would purge: $pf"
        fi
      done
    fi
  fi

  # Clean directories if empty (deepest first)
  if [ "$DRY_RUN" -eq 0 ]; then
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/skills/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/skills" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/rules" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/skills/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.claude/skills/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.claude/skills" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.claude/commands" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.claude" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.cursor/rules" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.cursor" 2>/dev/null || true
    rmdir "${TARGET_DIR}/skills/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/skills" 2>/dev/null || true
    rmdir "${TARGET_DIR}/rules" 2>/dev/null || true

    for uh in "${UNINSTALL_HARNESSES[@]}"; do
      if [ "$uh" = "antigravity" ] && [ "$IS_GLOBAL" -eq 1 ]; then
        update_plugins_json "$TARGET_DIR" "remove"
      fi
    done

    update_manifest_on_uninstall "$MANIFEST_PATH" "${UNINSTALL_HARNESSES[@]}"

    if [ "$DO_PURGE" -eq 1 ]; then
      if [ "$IS_GLOBAL" -eq 1 ]; then
        t_dir="${TARGET_DIR%/}"
        xdg_conf="${XDG_CONFIG_HOME:-$t_dir/.config}"
        for pf in "${xdg_conf%/}/grill-plan-team/ASSESSMENT.md" "${xdg_conf%/}/grill-plan-team/REQUIREMENTS.md" "${xdg_conf%/}/grill-plan-team/user-memory.md"; do
          if [ -f "$pf" ]; then
            rm -f "$pf"
            echo "Purged: $pf"
          fi
        done
        rmdir "${xdg_conf%/}/grill-plan-team" 2>/dev/null || true
      else
        for pf in "${TARGET_DIR%/}/.grill-plan-team/ASSESSMENT.md" "${TARGET_DIR%/}/.grill-plan-team/REQUIREMENTS.md" "${TARGET_DIR%/}/.grill-plan-team/project-memory.md"; do
          if [ -f "$pf" ]; then
            rm -f "$pf"
            echo "Purged: $pf"
          fi
        done
        rmdir "${TARGET_DIR%/}/.grill-plan-team" 2>/dev/null || true
      fi
    else
      echo "[memory] Preserved user memory files (use --purge to delete)"
    fi
  fi

  echo "Uninstallation complete. Cleaned ${REMOVED_COUNT} file(s)."
  exit 0
fi

# Detect installed harnesses
DETECTED=()
if has_antigravity; then DETECTED+=("antigravity"); fi
if has_claude; then DETECTED+=("claude"); fi
if has_cursor; then DETECTED+=("cursor"); fi
if has_windsurf; then DETECTED+=("windsurf"); fi
if has_roo; then DETECTED+=("roo"); fi

SELECTED_HARNESSES=()
if [ "$ALL_HARNESSES" -eq 1 ]; then
  SELECTED_HARNESSES=("antigravity" "claude" "cursor" "windsurf" "roo")
elif [ ${#VALID_REQUESTED_HARNESSES[@]} -gt 0 ]; then
  SELECTED_HARNESSES=("${VALID_REQUESTED_HARNESSES[@]}")
elif [ "$INTERACTIVE" -eq 1 ]; then
  if [ -t 0 ]; then
    echo "Detected harnesses: ${DETECTED[*]:-none}"
    echo "Select target:"
    echo "  1) Antigravity / Gemini CLI"
    echo "  2) Claude Code"
    echo "  3) Cursor"
    echo "  4) Windsurf"
    echo "  5) Roo Code / Cline"
    echo "  A) All harnesses"
    echo "  D) Detected harnesses only"
    read -r -p "Enter choice [D]: " choice
    choice="$(echo "$choice" | tr '[:lower:]' '[:upper:]')"
    case "$choice" in
      A) SELECTED_HARNESSES=("antigravity" "claude" "cursor" "windsurf" "roo") ;;
      1) SELECTED_HARNESSES=("antigravity") ;;
      2) SELECTED_HARNESSES=("claude") ;;
      3) SELECTED_HARNESSES=("cursor") ;;
      4) SELECTED_HARNESSES=("windsurf") ;;
      5) SELECTED_HARNESSES=("roo") ;;
      *) SELECTED_HARNESSES=("${DETECTED[@]:-antigravity}") ;;
    esac
  else
    echo "Warning: Interactive mode requested but stdin is not a TTY. Falling back to auto-detection." >&2
    if [ ${#DETECTED[@]} -gt 0 ]; then
      SELECTED_HARNESSES=("${DETECTED[@]}")
    else
      SELECTED_HARNESSES=("antigravity" "claude" "cursor" "windsurf" "roo")
    fi
  fi
else
  if [ ${#DETECTED[@]} -gt 0 ]; then
    SELECTED_HARNESSES=("${DETECTED[@]}")
  else
    SELECTED_HARNESSES=("antigravity" "claude" "cursor" "windsurf" "roo")
  fi
fi

echo "=== Installing grill-plan-team ==="
echo "Target scope: $([ "$IS_GLOBAL" -eq 1 ] && echo "Global (~)" || echo "$TARGET_DIR")"
echo "Selected harnesses: ${SELECTED_HARNESSES[*]}"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "Mode: DRY RUN (no files will be written)"
fi

# Install each harness
for h in "${SELECTED_HARNESSES[@]}"; do
  echo ""
  echo "Configuring $h..."
  case "$h" in
    antigravity)
      if [ "$IS_GLOBAL" -eq 1 ]; then
        CONTENT_PLUGIN="$(get_file_content "antigravity/plugin.json")"
        CONTENT_RULES="$(get_file_content "antigravity/rules/AGENTS.md")"
        CONTENT_SKILL="$(get_file_content "antigravity/skills/grill-plan-team/SKILL.md")"

        write_file_safe "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/plugin.json" "$CONTENT_PLUGIN"
        write_file_safe "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/rules/AGENTS.md" "$CONTENT_RULES"
        write_file_safe "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/skills/grill-plan-team/SKILL.md" "$CONTENT_SKILL"
        update_plugins_json "$TARGET_DIR" "add"
      else
        CONTENT_PLUGIN="$(get_file_content "antigravity/plugin.json")"
        CONTENT_RULES="$(get_file_content "antigravity/rules/AGENTS.md")"
        CONTENT_SKILL="$(get_file_content "antigravity/skills/grill-plan-team/SKILL.md")"

        write_file_safe "${TARGET_DIR}/plugin.json" "$CONTENT_PLUGIN"
        write_file_safe "${TARGET_DIR}/rules/AGENTS.md" "$CONTENT_RULES"
        write_file_safe "${TARGET_DIR}/skills/grill-plan-team/SKILL.md" "$CONTENT_SKILL"
      fi
      ;;

    claude)
      CONTENT_SKILL="$(get_file_content "claude/skills/grill-plan-team/SKILL.md")"
      CONTENT_CMD="$(get_file_content "claude/commands/grill-plan-team.md")"
      write_file_safe "${TARGET_DIR}/.claude/skills/grill-plan-team/SKILL.md" "$CONTENT_SKILL"
      write_file_safe "${TARGET_DIR}/.claude/commands/grill-plan-team.md" "$CONTENT_CMD"
      ;;

    cursor)
      CONTENT_MDC="$(get_file_content "cursor/.cursor/rules/grill-plan-team.mdc")"
      CONTENT_RULES="$(get_file_content "cursor/.cursorrules")"
      write_file_safe "${TARGET_DIR}/.cursor/rules/grill-plan-team.mdc" "$CONTENT_MDC"
      write_file_safe "${TARGET_DIR}/.cursorrules" "$CONTENT_RULES"
      ;;

    windsurf)
      CONTENT_RULES="$(get_file_content "windsurf/.windsurfrules")"
      write_file_safe "${TARGET_DIR}/.windsurfrules" "$CONTENT_RULES"
      ;;

    roo)
      CONTENT_MODES="$(get_file_content "roo/.roomodes")"
      CONTENT_RULES="$(get_file_content "roo/.clinerules")"
      write_file_safe "${TARGET_DIR}/.roomodes" "$CONTENT_MODES"
      write_file_safe "${TARGET_DIR}/.clinerules" "$CONTENT_RULES"
      ;;
  esac
done

# Save installation manifest
save_installation_manifest "$MANIFEST_PATH"

# Auto-initialize global user memory if it does not exist
target_home="${TARGET_DIR%/}"
if [ "$IS_GLOBAL" -eq 0 ]; then
  target_home="${HOME%/}"
fi
xdg_conf="${XDG_CONFIG_HOME:-$target_home/.config}"
mem_dir="${xdg_conf%/}/grill-plan-team"
assess_file="${mem_dir}/ASSESSMENT.md"
req_file="${mem_dir}/REQUIREMENTS.md"
legacy_file="${mem_dir}/user-memory.md"

if [ ! -f "$assess_file" ]; then
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] Would initialize assessment memory: $assess_file"
  else
    mkdir -p "$mem_dir"
    printf "%s\n" "$(get_memory_template "assessment")" > "$assess_file"
    echo "Initialized assessment memory: $assess_file"
  fi
fi

if [ ! -f "$req_file" ]; then
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] Would initialize requirements memory: $req_file"
  else
    mkdir -p "$mem_dir"
    printf "%s\n" "$(get_memory_template "requirements")" > "$req_file"
    echo "Initialized requirements memory: $req_file"
  fi
fi

if [ ! -f "$legacy_file" ]; then
  if [ "$DRY_RUN" -eq 0 ]; then
    mkdir -p "$mem_dir"
    printf "%s\n" "$(get_memory_template "user")" > "$legacy_file"
  fi
fi

echo ""
echo "Installation successful!"
echo "Workflow installed for: ${SELECTED_HARNESSES[*]}"
echo "Get started with: /grill-plan-team"
