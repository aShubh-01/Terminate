#!/bin/bash

# ── Termination System ─ Universal Bootstrap ─────────────────────
# Usage: curl -fsSL https://get.ashubh.dev | bash
# ─────────────────────────────────────────────────────────────────

BASE_URL="https://termination.ashubh.dev"   # Proxied via Cloudflare — storage origin hidden

# ── 1. Platform Detection ─────────────────────────────────────────
OS=$(uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m 2>/dev/null)

# Windows (Git Bash / WSL detection)
if [[ "$OS" == *"mingw"* || "$OS" == *"cygwin"* || "$OS" == *"msys"* ]]; then
    OS="windows"
fi

case "$OS" in
    darwin)
        if [[ "$ARCH" == "arm64" ]]; then
            PLATFORM="macos-arm64"
            BIN_FILE="termination-macos-arm64"
        else
            PLATFORM="macos-x64"
            BIN_FILE="termination-macos-x64"
        fi
        ;;
    linux)
        if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
            PLATFORM="linux-arm64"
            BIN_FILE="termination-linux-arm64"
        else
            PLATFORM="linux-x64"
            BIN_FILE="termination-linux-x64"
        fi
        ;;
    windows)
        echo "[ERROR] Windows is not yet supported. Use WSL (Windows Subsystem for Linux)."
        exit 1
        ;;
    *)
        echo "[ERROR] Unsupported platform: $OS ($ARCH)"
        exit 1
        ;;
esac

echo "[PROGRESS] STARTING TERMINATION SYSTEM INSTALLATION..."

# ── 2. Downloader (curl or wget fallback) ────────────────────────
download() {
    local url="$1"
    local dest="$2"
    if command -v curl > /dev/null 2>&1; then
        curl -fsSL "$url" -o "$dest"
    elif command -v wget > /dev/null 2>&1; then
        wget -q "$url" -O "$dest"
    else
        echo "[ERROR] Neither curl nor wget found. Please install one and retry."
        exit 1
    fi

    # Verify download succeeded (non-empty file)
    if [ ! -s "$dest" ]; then
        echo "[ERROR] Failed to download: $url"
        exit 1
    fi
}

# ── 3. Create Isolated Temp Working Directory ─────────────────────
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

mkdir -p "$TMP_DIR/dist"
mkdir -p "$TMP_DIR/shell-controllers"

# ── 4. Download Assets ───────────────────────────────────────────
echo "[PROGRESS] Fetching engines ($PLATFORM)..."
download "$BASE_URL/binaries/$BIN_FILE"               "$TMP_DIR/dist/$BIN_FILE"

echo "[PROGRESS] Fetching installer..."
download "$BASE_URL/install.sh"                        "$TMP_DIR/install.sh"

echo "[PROGRESS] Fetching shell configurations..."
download "$BASE_URL/shell-controllers/zsh.zsh"         "$TMP_DIR/shell-controllers/zsh.zsh"
download "$BASE_URL/shell-controllers/bash.sh"         "$TMP_DIR/shell-controllers/bash.sh"
download "$BASE_URL/shell-controllers/fish.fish"       "$TMP_DIR/shell-controllers/fish.fish"

# ── 5. Set Permissions ───────────────────────────────────────────
chmod +x "$TMP_DIR/dist/$BIN_FILE"
chmod +x "$TMP_DIR/install.sh"

# ── 6. Hand off to the full Installer ────────────────────────────
cd "$TMP_DIR" && bash install.sh
