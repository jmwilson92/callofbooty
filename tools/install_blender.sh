#!/usr/bin/env bash
# Install a portable Blender build into this Codespace (no root required).
# Usage:  ./tools/install_blender.sh
# Then:   export PATH="$HOME/.local/blender:$PATH"
#         blender --version

set -euo pipefail

VERSION="${BLENDER_VERSION:-4.2.9}"
ARCH="linux-x64"
NAME="blender-${VERSION}-${ARCH}"
URL="https://download.blender.org/release/Blender${VERSION%.*}/${NAME}.tar.xz"
INSTALL_DIR="${HOME}/.local/blender"
TMP="${TMPDIR:-/tmp}/blender-install-$$"

# Runtime libs Blender needs even for --background on minimal Codespaces
if command -v sudo >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
  echo "==> Installing system libraries (may ask for sudo)..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq \
    libxxf86vm1 libxfixes3 libxi6 libxkbcommon0 libsm6 libice6 \
    libgl1 libxrender1 libxcb1 libx11-6 libxext6 libxrandr2 \
    libxcursor1 libxinerama1 >/dev/null
fi

mkdir -p "$HOME/.local" "$TMP"
cd "$TMP"

echo "==> Downloading Blender ${VERSION} (~300MB)..."
if command -v curl >/dev/null 2>&1; then
  curl -L --fail -o blender.tar.xz "$URL"
elif command -v wget >/dev/null 2>&1; then
  wget -O blender.tar.xz "$URL"
else
  echo "Need curl or wget" >&2
  exit 1
fi

echo "==> Extracting..."
tar -xf blender.tar.xz
rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$NAME" "$INSTALL_DIR"

# Symlink into ~/.local/bin for PATH
mkdir -p "$HOME/.local/bin"
ln -sfn "$INSTALL_DIR/blender" "$HOME/.local/bin/blender"

# Shell hint
if ! grep -q '.local/bin' "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi

rm -rf "$TMP"

echo ""
echo "Blender installed to $INSTALL_DIR"
echo "Run:  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "Then: blender --version"
echo "      ./tools/build_props.sh"
"$HOME/.local/bin/blender" --version | head -3
