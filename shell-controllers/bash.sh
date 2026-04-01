#!/bin/bash
# ── Termination System Router (Bash Version) ─────────────────────

# ── Environment ──────
export CLI_TOOLS_CORE_PATH="${CLI_TOOLS_CORE_PATH:-$HOME/.termination/core}"
export DETECTOR_PORT="${CLI_DETECTOR_PORT:-4545}"

# ── Function: AI Detection ─
detect_command() {
  # Universal grep check; 1s timeout
  curl -s --connect-timeout 1 --max-time 1 -X POST "http://localhost:$DETECTOR_PORT" \
    -H "Content-Type: application/json" \
    -d "{\"input\":\"$1\"}" 2>/dev/null | grep -q '"result": true'
}

# ── Function: AI Runner ────
run_ai() {
  echo ""
  echo "AI PROMPT: $1"
  echo ""
}

# ── The Master Router ──────
_termination_router() {
  local full_cmd="$*"
  local bin_path="$CLI_TOOLS_CORE_PATH/bin/termination-engine"
  local index_path="$CLI_TOOLS_CORE_PATH/index.js"

  # 1. TOOL mode (:tool)
  if [[ "$full_cmd" == :* ]]; then
    echo ""
    if [ -x "$bin_path" ]; then
       "$bin_path" "$full_cmd"
    else
       node "$index_path" "$full_cmd"
    fi
    return 0
  fi

  # 2. PIPE mode (--)
  if [[ "$full_cmd" == --* ]]; then
    echo ""
    if [ -x "$bin_path" ]; then
       "$bin_path" "$full_cmd"
    else
       node "$index_path" "$full_cmd"
    fi
    return 0
  fi

  # 3. AI Fallback (Natural Language)
  # Go straight to AI mode for all other unrecognized commands
  run_ai "$full_cmd"
  return 0
}

# ── Connect to the Shell Engine ─────────────
command_not_found_handle() {
  _termination_router "$@"
  return $?
}

# Dual-link for wider compatibility
command_not_found_handler() {
  _termination_router "$@"
  return $?
}

# Interactive mode aliases
alias @='TERMINATION_MODE=AI; read -p "@ " p; run_ai "$p"; unset TERMINATION_MODE'
alias !='TERMINATION_MODE=SH; read -p "! " p; eval "$p"; unset TERMINATION_MODE'
