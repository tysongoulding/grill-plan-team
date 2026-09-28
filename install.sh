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
  if [ -n "$REPO_DIR" ] && [ -f "$REPO_DIR/templates/memory/${kind}-memory.md" ]; then
    cat "$REPO_DIR/templates/memory/${kind}-memory.md"
    return
  fi
  if command -v curl >/dev/null 2>&1; then
    content="$(curl -fsSL "${RAW_BASE}/templates/memory/${kind}-memory.md" 2>/dev/null || true)"
  elif command -v wget >/dev/null 2>&1; then
    content="$(wget -qO- "${RAW_BASE}/templates/memory/${kind}-memory.md" 2>/dev/null || true)"
  fi
  if [ -n "$content" ]; then
    printf "%s\n" "$content"
    return
  fi

  if [ "$kind" = "user" ]; then
    cat << 'EOF'
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
EOF
  else
    cat << 'EOF'
# Local Project Memory (grill-plan-team)

Repository-specific context, conventions, architectural decisions, and learned lessons.

## Project Archetype & Domain Terminology
- Archetype: Cross-harness AI agent workflow engine and installer CLI.
- Domain terms:
  - Harness: Target IDE or coding agent host (Antigravity, Claude Code, Cursor, Windsurf, Roo Code).
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
EOF
  fi
}

print_memory_help() {
  cat << 'EOF'
Grill-Plan-Team Two-Tier Memory CLI

Usage:
  ./install.sh memory init [--project | --user]
  ./install.sh memory show [--project | --user]
  ./install.sh memory path [--project | --user]

Options:
  --user, -u          Target global user memory (~/.config/grill-plan-team/user-memory.md) (default)
  --project, -p       Target local project memory (.grill-plan-team/project-memory.md)
  --local, -l [path]  Target specific project directory for --project
  --force, -f         Force overwrite of existing memory file on init
  --help, -h          Show this help message
EOF
}

# Handle memory subcommand if requested
if [ "${1:-}" = "memory" ]; then
  shift
  subcmd="${1:-}"
  if [ -n "$subcmd" ] && [[ "$subcmd" != -* ]]; then
    shift
  else
    subcmd=""
  fi
  mem_target="user"
  mem_local_path=""
  mem_force=0

  while [ $# -gt 0 ]; do
    case "$1" in
      --user|-u)
        mem_target="user"
        shift
        ;;
      --project|-p)
        mem_target="project"
        shift
        ;;
      --force|-f)
        mem_force=1
        shift
        ;;
      --local|-l)
        if [ $# -gt 1 ] && [[ "$2" != -* ]]; then
          mem_local_path="$(echo "$2" | xargs)"
          shift 2
        else
          mem_local_path="$(pwd)"
          shift
        fi
        ;;
      --local=*|-l=*)
        raw_val="${1#*=}"
        mem_local_path="$(echo "$raw_val" | xargs)"
        shift
        ;;
      --help|-h)
        print_memory_help
        exit 0
        ;;
      *)
        echo "Error: Unknown memory option: $1" >&2
        print_memory_help
        exit 1
        ;;
    esac
  done

  mem_home="${HOME}"
  mem_base="${mem_local_path:-$(pwd)}"

  case "$subcmd" in
    path)
      if [ "$mem_target" = "project" ]; then
        echo "${mem_base}/.grill-plan-team/project-memory.md"
      else
        echo "${XDG_CONFIG_HOME:-$mem_home/.config}/grill-plan-team/user-memory.md"
      fi
      exit 0
      ;;
    init)
      if [ "$mem_target" = "project" ]; then
        target_file="${mem_base}/.grill-plan-team/project-memory.md"
        if [ -f "$target_file" ] && [ "$mem_force" -eq 0 ]; then
          echo "Project memory already exists at: $target_file"
        else
          content="$(get_memory_template "project")"
          mkdir -p "$(dirname "$target_file")"
          printf "%s\n" "$content" > "$target_file"
          echo "Initialized project memory: $target_file"
        fi
      else
        target_file="${XDG_CONFIG_HOME:-$mem_home/.config}/grill-plan-team/user-memory.md"
        if [ -f "$target_file" ] && [ "$mem_force" -eq 0 ]; then
          echo "User memory already exists at: $target_file"
        else
          content="$(get_memory_template "user")"
          mkdir -p "$(dirname "$target_file")"
          printf "%s\n" "$content" > "$target_file"
          echo "Initialized user memory: $target_file"
        fi
      fi
      exit 0
      ;;
    show)
      if [ "$mem_target" = "project" ]; then
        target_file="${mem_base}/.grill-plan-team/project-memory.md"
      else
        target_file="${XDG_CONFIG_HOME:-$mem_home/.config}/grill-plan-team/user-memory.md"
      fi
      if [ ! -f "$target_file" ]; then
        echo "Error: Memory file not found at $target_file" >&2
        exit 1
      fi
      cat "$target_file"
      exit 0
      ;;
    --help|-h|"")
      print_memory_help
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
        raw_target="$(echo "$2" | xargs)"
        if [ -n "$raw_target" ]; then
          mkdir -p "$raw_target" 2>/dev/null || true
          TARGET_DIR="$(cd "$raw_target" 2>/dev/null && pwd || echo "$raw_target")"
        else
          TARGET_DIR="$(pwd)"
        fi
        shift 2
      else
        TARGET_DIR="$(pwd)"
        shift
      fi
      ;;
    --local=*|-l=*)
      IS_GLOBAL=0
      raw_val="${1#*=}"
      raw_target="$(echo "$raw_val" | xargs)"
      if [ -n "$raw_target" ]; then
        mkdir -p "$raw_target" 2>/dev/null || true
        TARGET_DIR="$(cd "$raw_target" 2>/dev/null && pwd || echo "$raw_target")"
      else
        TARGET_DIR="$(pwd)"
      fi
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
          cleaned="$(echo "$i" | tr '[:upper:]' '[:lower:]' | xargs)"
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
        cleaned="$(echo "$i" | tr '[:upper:]' '[:lower:]' | xargs)"
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
    cleaned_h="$(echo "$h" | tr '[:upper:]' '[:lower:]' | xargs)"
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
      PURGE_FILE="${XDG_CONFIG_HOME:-$TARGET_DIR/.config}/grill-plan-team/user-memory.md"
      if [ -f "$PURGE_FILE" ]; then
        echo "[dry-run] Would purge: $PURGE_FILE"
      fi
    else
      PURGE_FILE="${TARGET_DIR}/.grill-plan-team/project-memory.md"
      if [ -f "$PURGE_FILE" ]; then
        echo "[dry-run] Would purge: $PURGE_FILE"
      fi
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
        PURGE_FILE="${XDG_CONFIG_HOME:-$TARGET_DIR/.config}/grill-plan-team/user-memory.md"
        if [ -f "$PURGE_FILE" ]; then
          rm -f "$PURGE_FILE"
          echo "Purged: $PURGE_FILE"
          rmdir "$(dirname "$PURGE_FILE")" 2>/dev/null || true
        fi
      else
        PURGE_FILE="${TARGET_DIR}/.grill-plan-team/project-memory.md"
        if [ -f "$PURGE_FILE" ]; then
          rm -f "$PURGE_FILE"
          echo "Purged: $PURGE_FILE"
          rmdir "$(dirname "$PURGE_FILE")" 2>/dev/null || true
        fi
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
        write_file_safe "${TARGET_DIR}/.gemini/config/skills/grill-plan-team/SKILL.md" "$CONTENT_SKILL"
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
target_home="${TARGET_DIR}"
if [ "$IS_GLOBAL" -eq 0 ]; then
  target_home="${HOME}"
fi
user_mem_file="${XDG_CONFIG_HOME:-$target_home/.config}/grill-plan-team/user-memory.md"
if [ ! -f "$user_mem_file" ]; then
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] Would initialize global user memory: $user_mem_file"
  else
    mkdir -p "$(dirname "$user_mem_file")"
    content="$(get_memory_template "user")"
    printf "%s\n" "$content" > "$user_mem_file"
    echo "Initialized user memory: $user_mem_file"
  fi
fi

echo ""
echo "Installation successful!"
echo "Workflow installed for: ${SELECTED_HARNESSES[*]}"
echo "Get started with: /grill-plan-team"
