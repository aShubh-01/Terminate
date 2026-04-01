#!/bin/bash

# ── Termination Release Upload Script ───────────────────────────
# Uploads all distribution assets to Cloudflare R2 (or any S3-compatible storage)
# Prerequisites: rclone configured with your R2 bucket as 'r2:termination-cdn'
#
# Setup rclone for Cloudflare R2:
#   rclone config → New remote → S3-compatible → Cloudflare R2
#   Then: rclone config show  (to verify)
#
# Run: bash scripts/upload-release.sh

BUCKET="r2:terminate-binaries"             # Your Cloudflare R2 bucket (rclone remote)
VERSION=$(cat package.json | grep '"version"' | cut -d'"' -f4)

# Ensure binaries exist
if [ ! -f "dist/termination-macos-arm64" ]; then
    echo "[ERROR] Binaries not found in dist/. Run 'npm run build' first."
    exit 1
fi

echo "[RELEASE] Uploading to Cloudflare R2 ($BUCKET)..."

# ── Binaries ───────────────────────────────────────────────────
rclone copyto dist/termination-macos-arm64  "$BUCKET/binaries/termination-macos-arm64"  --progress --s3-no-check-bucket
rclone copyto dist/termination-macos-x64    "$BUCKET/binaries/termination-macos-x64"    --progress --s3-no-check-bucket

# Linux targets
rclone copyto dist/termination-linux-arm64  "$BUCKET/binaries/termination-linux-arm64"  --progress --s3-no-check-bucket
rclone copyto dist/termination-linux-x64    "$BUCKET/binaries/termination-linux-x64"    --progress --s3-no-check-bucket

# ── Shell Controllers ──────────────────────────────────────────
rclone copyto shell-controllers/zsh.zsh   "$BUCKET/shell-controllers/zsh.zsh"       --progress --s3-no-check-bucket
rclone copyto shell-controllers/bash.sh   "$BUCKET/shell-controllers/bash.sh"       --progress --s3-no-check-bucket
rclone copyto shell-controllers/fish.fish "$BUCKET/shell-controllers/fish.fish"     --progress --s3-no-check-bucket

# ── Installer ─────────────────────────────────────────────────
rclone copyto install.sh                  "$BUCKET/install.sh"                      --progress --s3-no-check-bucket
rclone copyto get.sh                      "$BUCKET/get"                             --progress --s3-no-check-bucket

echo ""
echo "[SUCCESS] Release v$VERSION uploaded and live."
echo ""
echo "Try the command:"
echo "  curl -fsSL https://termination.ashubh.dev/get | bash"
