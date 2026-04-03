# ──────────────────────────────────────────────
# TERMINATION ENGINE ROUTER  —  paste into .zshrc
# ──────────────────────────────────────────────

setopt NO_BANG_HIST

# ── Dynamic Environment Config ─────────────────────
# These are set during installation in your .zshrc
SCRIPT_HOME="${CLI_TOOLS_CORE_PATH:-$HOME/.termination/core}"
DETECTOR_PORT="${CLI_DETECTOR_PORT:-4545}"

AUTO_PREFIX=""          # global: "", "@ ", or "! "
_IN_SHELL_MODE=0        # flag: suppress AI fallback during eval

# ── Colors ─────────────────────────────────────
_COLOR_AI="fg=cyan,bold"
_COLOR_SH="fg=green,bold"

# ── Apply color highlight to the prefix symbol ─
_apply_prefix_highlight() {
  if [[ "$AUTO_PREFIX" == "@ " ]]; then
    zle_highlight=( region:0:1:$_COLOR_AI )
  elif [[ "$AUTO_PREFIX" == "! " ]]; then
    zle_highlight=( region:0:1:$_COLOR_SH )
  else
    zle_highlight=()
  fi
}

# ── Detector API ───────────────────────────────
detect_command() {
  # Simple grep check to avoid dependency on jq
  curl -s --connect-timeout 1 --max-time 1 -X POST "http://localhost:$DETECTOR_PORT" \
    -H "Content-Type: application/json" \
    -d "{\"input\":\"$1\"}" 2>/dev/null | grep -q '"result": true'
}

# ── AI invocation ──────────────────────────────
run_ai() {
  print ""
  echo "AI PROMPT: $1"
  echo ""
}

# ── Shell execution (with AI fallback suppressed)
run_shell() {
  _IN_SHELL_MODE=1
  print ""
  eval "$1"
  _IN_SHELL_MODE=0
}

# ── ZLE: inject AUTO_PREFIX on every new line ──
zle-line-init() {
  if [[ -n "$AUTO_PREFIX" ]]; then
    BUFFER="$AUTO_PREFIX"
    CURSOR=${#BUFFER}
    _apply_prefix_highlight
    zle -R
  fi
}
zle -N zle-line-init

# ── ZLE: detect manual prefix deletion + recolor
zle-line-pre-redraw() {
  if [[ -n "$AUTO_PREFIX" && "$BUFFER" != "$AUTO_PREFIX"* ]]; then
    AUTO_PREFIX=""
    zle_highlight=()
  else
    _apply_prefix_highlight
  fi
}
zle -N zle-line-pre-redraw

# ── Reinject helper (used after every command) ─
_reinject() {
  BUFFER="$AUTO_PREFIX"
  CURSOR=${#BUFFER}
  _apply_prefix_highlight
  zle -R
}

# ── MAIN ROUTER ────────────────────────────────
router_accept_line() {
  local raw="$BUFFER"

  local first="${raw%% *}"
  local rest="${raw#"$first"}"
  rest="${rest# }"

  BUFFER=""
  zle_highlight=()

  # ── PIPELINE prefix  -- ───────────────────────
  if [[ "$first" == "--" ]]; then
    print -s -- "$raw"
    zle .reset-prompt
    # Try binary first, then node fallback
    if [[ -x "$SCRIPT_HOME/bin/termination-engine" ]]; then
      "$SCRIPT_HOME/bin/termination-engine" "$raw" 2>&1
    else
      node "$SCRIPT_HOME/index.js" "$raw" 2>&1
    fi

    _reinject
    return
  fi

  # ── TOOL prefix  :tool.function ──────────────
  if [[ "$first" == :* ]]; then
    print -s -- "$raw"
    zle .reset-prompt
    # Try binary first, then node fallback
    if [[ -x "$SCRIPT_HOME/bin/termination-engine" ]]; then
      "$SCRIPT_HOME/bin/termination-engine" "$raw" 2>&1
    else
      node "$SCRIPT_HOME/index.js" "$raw" 2>&1
    fi

    _reinject
    return
  fi

  # ── AI prefix  @ ────────────────────────────
  if [[ "$first" == "@" ]]; then
    local prev="$AUTO_PREFIX"
    AUTO_PREFIX="@ "
    zle .reset-prompt

    if [[ "$prev" != "@ " ]]; then
      print ""
      echo " ai mode - type your prompt, backspace @ to exit"
    fi

    if [[ -n "$rest" ]]; then
      run_ai "$rest"
    fi

    _reinject
    return
  fi

  # ── Shell prefix  ! ────────────────────────── 
  if [[ "$first" == "!" ]]; then
    local prev="$AUTO_PREFIX"
    AUTO_PREFIX="! "
    zle .reset-prompt

    if [[ "$prev" != "! " ]]; then
      print ""
      echo " shell mode - type any command, backspace ! to exit"
    fi

    if [[ -n "$rest" ]]; then
      run_shell "$rest"
    fi

    _reinject
    return
  fi

  # ── AUTO_PREFIX @ active ─────────────────────
  if [[ "$AUTO_PREFIX" == "@ " ]]; then
    local payload="${raw#"@ "}"
    zle .reset-prompt
    if [[ -n "$payload" ]]; then
      run_ai "$payload"
    fi
    _reinject
    return
  fi

  # ── AUTO_PREFIX ! active ─────────────────────
  if [[ "$AUTO_PREFIX" == "! " ]]; then
    local shell_cmd="${raw#"! "}"
    zle .reset-prompt
    if [[ -n "$shell_cmd" ]]; then
      run_shell "$shell_cmd"
    fi
    _reinject
    return
  fi

  # ── Default: plain shell command ────────────
  BUFFER="$raw"
  zle .accept-line
}

zle -N accept-line router_accept_line

# ── command_not_found fallback ─────────────────
command_not_found_handler() {
  # Never fall through to AI when inside run_shell
  if [[ "$_IN_SHELL_MODE" == "1" ]]; then
    print -u2 "zsh: command not found: $1"
    return 127
  fi

  local first="$1"; shift
  local full="${first}${*:+ $*}"
  full="${full%% }"

  # AI Fallback - Directly call AI for all unknown commands
  run_ai "$full"
  return 0
}