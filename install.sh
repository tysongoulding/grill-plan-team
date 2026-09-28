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

print_help() {
  cat << 'EOF'
Grill-Plan-Team Universal Shell Installer

Usage:
  ./install.sh [options]
  curl -fsSL https://raw.githubusercontent.com/tysongoulding/grill-plan-team/main/install.sh | bash -s -- [options]

Options:
  --global, -g          Install to user-level global configuration directories (default)
  --local, -l [path]    Install to project repository at [path] (default: current directory)
  --all, -a             Install to all supported harnesses regardless of host detection
  --harness <name>      Target specific harness(es): antigravity, claude, cursor, windsurf, roo
  --uninstall, -u       Cleanly remove installed grill-plan-team configurations
  --dry-run, -d         Preview changes without modifying the filesystem
  --interactive         Prompt for target harnesses interactively
  --help, -h            Show this help documentation

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
        mkdir -p "$2" 2>/dev/null || true
        TARGET_DIR="$(cd "$2" 2>/dev/null && pwd || echo "$2")"
        shift 2
      else
        TARGET_DIR="$(pwd)"
        shift
      fi
      ;;
    --local=*)
      IS_GLOBAL=0
      mkdir -p "${1#*=}" 2>/dev/null || true
      TARGET_DIR="$(cd "${1#*=}" 2>/dev/null && pwd || echo "${1#*=}")"
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
        IFS=',' read -ra ADDR <<< "$2"
        for i in "${ADDR[@]}"; do
          REQUESTED_HARNESSES+=("$i")
        done
        shift 2
      else
        echo "Error: --harness requires an argument." >&2
        exit 1
      fi
      ;;
    --harness=*)
      val="${1#*=}"
      if [ -z "$val" ]; then
        echo "Error: --harness requires an argument." >&2
        exit 1
      fi
      IFS=',' read -ra ADDR <<< "$val"
      for i in "${ADDR[@]}"; do
        REQUESTED_HARNESSES+=("$i")
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

MANIFEST_PATH="${TARGET_DIR}/${MANIFEST_FILE}"

if [ "$DO_UNINSTALL" -eq 1 ]; then
  echo "=== Uninstalling grill-plan-team from ${TARGET_DIR} ==="
  declare -a UNINSTALL_HARNESSES=()
  if [ ${#REQUESTED_HARNESSES[@]} -gt 0 ]; then
    for h in "${REQUESTED_HARNESSES[@]}"; do
      case "$h" in
        antigravity|gemini|agy) UNINSTALL_HARNESSES+=("antigravity") ;;
        claude|claude-code) UNINSTALL_HARNESSES+=("claude") ;;
        cursor) UNINSTALL_HARNESSES+=("cursor") ;;
        windsurf) UNINSTALL_HARNESSES+=("windsurf") ;;
        roo|cline|roo-code) UNINSTALL_HARNESSES+=("roo") ;;
        *) echo "Warning: Unknown harness '$h' ignored." >&2 ;;
      esac
    done
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

  # Clean directories if empty (deepest first)
  if [ "$DRY_RUN" -eq 0 ]; then
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/skills/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/skills" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team/rules" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/plugins/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/skills/grill-plan-team" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config/skills" 2>/dev/null || true
    rmdir "${TARGET_DIR}/.gemini/config" 2>/dev/null || true
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

    if [ ${#REQUESTED_HARNESSES[@]} -eq 0 ]; then
      rm -f "$MANIFEST_PATH"
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
elif [ ${#REQUESTED_HARNESSES[@]} -gt 0 ]; then
  for h in "${REQUESTED_HARNESSES[@]}"; do
    case "$h" in
      antigravity|gemini|agy) SELECTED_HARNESSES+=("antigravity") ;;
      claude|claude-code) SELECTED_HARNESSES+=("claude") ;;
      cursor) SELECTED_HARNESSES+=("cursor") ;;
      windsurf) SELECTED_HARNESSES+=("windsurf") ;;
      roo|cline|roo-code) SELECTED_HARNESSES+=("roo") ;;
      *) echo "Warning: Unknown harness '$h' ignored." >&2 ;;
    esac
  done
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
if [ "$DRY_RUN" -eq 0 ]; then
  cat > "$MANIFEST_PATH" << EOF
{
  "installedFiles": [$(printf '"%s",' "${INSTALLED_FILES[@]}" | sed 's/,$//')],
  "harnesses": [$(printf '"%s",' "${SELECTED_HARNESSES[@]}" | sed 's/,$//')],
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0"
}
EOF
fi

echo ""
echo "Installation successful!"
echo "Workflow installed for: ${SELECTED_HARNESSES[*]}"
echo "Get started with: /grill-plan-team"
