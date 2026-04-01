#!/bin/bash

# ── Termination System ─ Installer ───────────────────────────────
CORE_HOME="$HOME/.termination/core"
BIN_NAME="termination-engine"

# DIST_PATH can be overridden by get.sh when running from a temp dir
# Defaults to ./dist for local development installs
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_PATH="${DIST_PATH:-$SCRIPT_DIR/dist}"

# 1. Platform Detection
OS=$(uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
    darwin)
        [[ "$ARCH" == "arm64" ]] && SOURCE_BIN="termination-macos-arm64" || SOURCE_BIN="termination-macos-x64"
        ;;
    linux)
        [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]] && SOURCE_BIN="termination-linux-arm64" || SOURCE_BIN="termination-linux-x64"
        ;;
    *)
        echo "[ERROR] Unsupported platform: $OS ($ARCH)"
        exit 1
        ;;
esac

# 2. Setup Hidden Termination Folders
mkdir -p "$CORE_HOME/bin"

if [ ! -f "$DIST_PATH/$SOURCE_BIN" ]; then
    echo "[ERROR] Termination engine could not be found: $DIST_PATH/$SOURCE_BIN"
    exit 1
fi

cp "$DIST_PATH/$SOURCE_BIN" "$CORE_HOME/bin/$BIN_NAME"
chmod +x "$CORE_HOME/bin/$BIN_NAME"

# 3. User Workspace Selection
printf "[PROMPT] Where would you like to keep your workspace? (Default: $HOME/termination): "
read USER_WORKSPACE < /dev/tty
USER_WORKSPACE=${USER_WORKSPACE:-$HOME/termination}

# Create Default Config
echo "{ \"userPath\": \"$USER_WORKSPACE\" }" > "$CORE_HOME/config.json"

# 4. Mandatory Authentication Prompt
"$CORE_HOME/bin/$BIN_NAME" ":setup.login" key="SIMULATED_PROD_KEY" > /dev/null 2>&1

# 5. Initialize Workspace
"$CORE_HOME/bin/$BIN_NAME" ":setup.init" workspace="$USER_WORKSPACE" > /dev/null 2>&1

# 6. Global Shell Configuration
HOOK_DIR="$CORE_HOME/shell-controllers"
mkdir -p "$HOOK_DIR"

configure_shell() {
    local SHELL_NAME=$1
    local CONFIG_FILE=$2
    local CONTROLLER=$3
    local HOOK_BLOCK=$4

    # Check if the shell itself is installed on the system
    if command -v "$SHELL_NAME" > /dev/null 2>&1; then
        # Create config file if it doesn't exist
        mkdir -p "$(dirname "$CONFIG_FILE")"
        touch "$CONFIG_FILE" 2>/dev/null

        # 1. Purge all legacy hooks (handles old branding)
        sed -i.bak "/BLUEBERRY CORE ENGINE HOOK/,/router.zsh/d" "$CONFIG_FILE" > /dev/null 2>&1
        sed -i.bak "/TERMINATION SYSTEM HOOK/,/router/d" "$CONFIG_FILE" > /dev/null 2>&1
        sed -i.bak "/CLI_TOOLS_CORE_PATH/d" "$CONFIG_FILE" > /dev/null 2>&1
        
        # 2. Deploy fresh controller
        cp "shell-controllers/$CONTROLLER" "$HOOK_DIR/$CONTROLLER"
        
        # 3. Inject fresh Hook
        echo -e "\n$HOOK_BLOCK" >> "$CONFIG_FILE"
        
        echo "[SUCCESS] Configured $SHELL_NAME -> $(basename "$CONFIG_FILE")"
    fi
}

# --- 6. Terminal Activation Menu (Premium Node UI) ---
# Run engine directly (NOT in a subshell) so TTY stays interactive
"$CORE_HOME/bin/$BIN_NAME" ":setup.select_shells"

# Read result from temp file written by the engine
SELECTED_SHELLS_RAW=$(cat /tmp/.termination_shells 2>/dev/null)
rm -f /tmp/.termination_shells

# Split comma-separated list into array
IFS=',' read -ra SELECTED_SHELLS <<< "$SELECTED_SHELLS_RAW"

# Execute Activation
for shell in "${SELECTED_SHELLS[@]}"; do
    case "$shell" in
        zsh)
            configure_shell "zsh" "$HOME/.zshrc" "zsh.zsh" "# TERMINATION SYSTEM HOOK\nexport CLI_TOOLS_CORE_PATH=\"$CORE_HOME\"\nsource $HOOK_DIR/zsh.zsh"
            ;;
        bash)
            BASH_HOOK="# TERMINATION SYSTEM HOOK\nexport CLI_TOOLS_CORE_PATH=\"$CORE_HOME\"\nsource $HOOK_DIR/bash.sh"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                configure_shell "bash" "$HOME/.bash_profile" "bash.sh" "$BASH_HOOK"
            else
                configure_shell "bash" "$HOME/.bashrc" "bash.sh" "$BASH_HOOK"
            fi
            ;;
        fish)
            FISH_HOOK="# TERMINATION SYSTEM HOOK\nset -gx CLI_TOOLS_CORE_PATH \"$CORE_HOME\"\nsource $HOOK_DIR/fish.fish"
            configure_shell "fish" "$HOME/.config/fish/config.fish" "fish.fish" "$FISH_HOOK"
            ;;
    esac
done

echo "--------------------------------------------------------"
echo "[SUCCESS] TERMINATION INSTALLED"
echo "WORKSPACE: $USER_WORKSPACE"
echo "--------------------------------------------------------"
echo "INSTALLATION FINISHED!"

# Seamlessly restart the shell with the new config
exec "$SHELL"