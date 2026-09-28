#!/usr/bin/env bash
# Universal Installer for grill-plan-team
# Cross-harness installer for 12 AI coding agents.
set -euo pipefail

SCRIPT_SOURCE="${BASH_SOURCE[0]:-}"
if [ -n "$SCRIPT_SOURCE" ] && [ -f "$SCRIPT_SOURCE" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
else
  SCRIPT_DIR=""
fi

# Fast path: delegate directly to Node installer when available
if command -v node >/dev/null 2>&1 && [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/bin/install.js" ]; then
  export GRILL_CALLER=shell
  exec node "$SCRIPT_DIR/bin/install.js" "$@"
fi

# Minimal POSIX Bash fallback (< 120 lines) when node is unavailable
TARGET_DIR="$HOME"
IS_GLOBAL=1
DO_UNINSTALL=0
DO_PURGE=0
DRY_RUN=0
HARNESSES=()
ALL_HARNESSES=("antigravity" "claude" "cursor" "windsurf" "roo" "kimi" "hermes" "pi" "omp" "opencode" "codex" "grok")

while [ $# -gt 0 ]; do
  case "$1" in
    --global|-g) IS_GLOBAL=1; TARGET_DIR="$HOME"; shift ;;
    --local|-l) IS_GLOBAL=0; TARGET_DIR="${2:-$(pwd)}"; shift $([ $# -gt 1 ] && [[ "$2" != -* ]] && echo 2 || echo 1) ;;
    --local=*|-l=*) IS_GLOBAL=0; TARGET_DIR="${1#*=}"; shift ;;
    --all|-a) HARNESSES=("${ALL_HARNESSES[@]}"); shift ;;
    --uninstall|-u|uninstall|remove) DO_UNINSTALL=1; shift ;;
    --purge) DO_PURGE=1; shift ;;
    --dry-run|-d) DRY_RUN=1; shift ;;
    --harness)
      raw="${2:-}"
      [ -z "$(echo "$raw" | tr -d '[:space:]')" ] && { echo "Error: --harness requires an argument." >&2; exit 1; }
      IFS=',' read -ra PARTS <<< "$raw"; for p in "${PARTS[@]}"; do HARNESSES+=("$(echo "$p" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"); done; shift 2 ;;
    --harness=*)
      raw="${1#*=}"
      [ -z "$(echo "$raw" | tr -d '[:space:]')" ] && { echo "Error: --harness requires an argument." >&2; exit 1; }
      IFS=',' read -ra PARTS <<< "$raw"; for p in "${PARTS[@]}"; do HARNESSES+=("$(echo "$p" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"); done; shift ;;
    memory|assess) echo "Memory/assess subcommands require Node.js runtime."; exit 1 ;;
    --help|-h) echo "Usage: ./install.sh [--global | --local [dir]] [--all] [--harness <name>] [--uninstall] [--purge] [--dry-run]"; exit 0 ;;
    *) echo "Error: Unknown option: $1" >&2; exit 1 ;;
  esac
done

[ ${#HARNESSES[@]} -eq 0 ] && HARNESSES=("${ALL_HARNESSES[@]}")

copy_f() {
  local s="$1" d="$2"
  if [ "$DRY_RUN" -eq 1 ]; then echo "[dry-run] Would write: $d"; else mkdir -p "$(dirname "$d")"; cp "$s" "$d"; echo "Created: $d"; fi
}
del_f() {
  local d="$1"
  if [ -f "$d" ]; then if [ "$DRY_RUN" -eq 1 ]; then echo "[dry-run] Would remove: $d"; else rm -f "$d"; echo "Removed: $d"; fi; fi
}

apply_harness() {
  local h="$1" op="$2"
  case "$h" in
    antigravity)
      if [ "$IS_GLOBAL" -eq 1 ]; then
        $op "$SCRIPT_DIR/plugin.json" "$TARGET_DIR/.gemini/config/plugins/grill-plan-team/plugin.json"
        $op "$SCRIPT_DIR/rules/AGENTS.md" "$TARGET_DIR/.gemini/config/plugins/grill-plan-team/rules/AGENTS.md"
        $op "$SCRIPT_DIR/skills/grill-plan-team/SKILL.md" "$TARGET_DIR/.gemini/config/plugins/grill-plan-team/skills/grill-plan-team/SKILL.md"
        [ "$op" = "del_f" ] && del_f "$TARGET_DIR/.gemini/config/skills/grill-plan-team/SKILL.md"
      else
        $op "$SCRIPT_DIR/plugin.json" "$TARGET_DIR/plugin.json"
        $op "$SCRIPT_DIR/rules/AGENTS.md" "$TARGET_DIR/rules/AGENTS.md"
        $op "$SCRIPT_DIR/skills/grill-plan-team/SKILL.md" "$TARGET_DIR/skills/grill-plan-team/SKILL.md"
      fi ;;
    claude)
      $op "$SCRIPT_DIR/skills/grill-plan-team/SKILL.md" "$TARGET_DIR/.claude/skills/grill-plan-team/SKILL.md"
      $op "$SCRIPT_DIR/.claude/commands/grill-plan-team.md" "$TARGET_DIR/.claude/commands/grill-plan-team.md" ;;
    cursor)
      $op "$SCRIPT_DIR/.cursor/rules/grill-plan-team.mdc" "$TARGET_DIR/.cursor/rules/grill-plan-team.mdc"
      $op "$SCRIPT_DIR/.cursorrules" "$TARGET_DIR/.cursorrules"
      [ "$op" = "del_f" ] && del_f "$TARGET_DIR/.cursor/skills/grill-plan-team/SKILL.md" ;;
    windsurf) $op "$SCRIPT_DIR/.windsurfrules" "$TARGET_DIR/.windsurfrules" ;;
    roo)
      $op "$SCRIPT_DIR/.roomodes" "$TARGET_DIR/.roomodes"
      $op "$SCRIPT_DIR/.clinerules" "$TARGET_DIR/.clinerules" ;;
    kimi|hermes|pi|omp|opencode|codex|grok)
      local dest=""
      case "$h" in
        kimi) dest="$TARGET_DIR/.kimi/skills/grill-plan-team/SKILL.md" ;;
        hermes) dest="$TARGET_DIR/.hermes/skills/grill-plan-team/SKILL.md" ;;
        pi) dest="$([ "$IS_GLOBAL" -eq 1 ] && echo "$TARGET_DIR/.pi/agent" || echo "$TARGET_DIR/.pi")/skills/grill-plan-team/SKILL.md" ;;
        omp) dest="$TARGET_DIR/.omp/skills/grill-plan-team/SKILL.md" ;;
        opencode) dest="$([ "$IS_GLOBAL" -eq 1 ] && echo "$TARGET_DIR/.config/opencode" || echo "$TARGET_DIR/.opencode")/skills/grill-plan-team/SKILL.md" ;;
        codex) dest="$TARGET_DIR/.codex/skills/grill-plan-team/SKILL.md" ;;
        grok) dest="$TARGET_DIR/.grok/skills/grill-plan-team/SKILL.md" ;;
      esac
      $op "$SCRIPT_DIR/skills/grill-plan-team/SKILL.md" "$dest"
      if [ "$IS_GLOBAL" -eq 0 ]; then
        $op "$SCRIPT_DIR/skills/grill-plan-team/SKILL.md" "$TARGET_DIR/.agents/skills/grill-plan-team/SKILL.md"
      fi ;;
  esac
}

OP="copy_f"
[ "$DO_UNINSTALL" -eq 1 ] && OP="del_f"

for h in "${HARNESSES[@]}"; do
  apply_harness "$h" "$OP"
done

if [ "$DO_UNINSTALL" -eq 1 ]; then
  del_f "$TARGET_DIR/.grill-plan-team-manifest.json"
  if [ "$DO_PURGE" -eq 1 ]; then
    rm -rf "$TARGET_DIR/.grill-plan-team" "$HOME/.config/grill-plan-team"
  fi
fi
