# ── Termination System Router (Fish Version) ─────────────────────

# ── Dynamic Environment Config ─────────────────────
set -q CLI_TOOLS_CORE_PATH; or set -g CLI_TOOLS_CORE_PATH "$HOME/.termination/core"
set -g SCRIPT_HOME "$CLI_TOOLS_CORE_PATH"
set -g DETECTOR_PORT 4545

# ── AI invocation ──────────────────────────────
function run_ai
  echo ""
  echo "AI PROMPT: $argv"
  echo ""
end

# ── Main Interceptor logic for Fish ────────────────
# Fish uses fish_command_not_found event
function fish_command_not_found
  set -l full_cmd "$argv"

  # 1. TOOL prefix :tool.function
  if string match -q ':*' "$full_cmd"
    echo ""
    if test -x "$SCRIPT_HOME/bin/termination-engine"
       "$SCRIPT_HOME/bin/termination-engine" "$full_cmd"
    else
       node "$SCRIPT_HOME/index.js" "$full_cmd"
    fi
    return 0
  fi

  # 2. PIPELINE prefix --
  if string match -q '--*' "$full_cmd"
    echo ""
    if test -x "$SCRIPT_HOME/bin/termination-engine"
       "$SCRIPT_HOME/bin/termination-engine" "$full_cmd"
    else
       node "$SCRIPT_HOME/index.js" "$full_cmd"
    fi
    return 0
  fi

  # 3. AI Fallback (Natural Language Detection)
  run_ai "$full_cmd"
  return 0
end
