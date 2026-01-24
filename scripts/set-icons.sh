#!/usr/bin/env bash
# Usage:
# 1. Download the attachment image (the QFI brain image) into the project root and name it qfi.png
#    or place it anywhere and pass the path as the first argument.
# 2. Run: ./scripts/set-icons.sh [path/to/image.png]
#
# This script will create/overwrite public/icon-192.png and public/icon-512.png.
# It prefers macOS built-in `sips` and falls back to ImageMagick (`magick` / `convert`).

set -euo pipefail

SRC=${1:-qfi.png}
OUT_DIR="public"

if [ ! -f "$SRC" ]; then
  echo "Source image not found: $SRC"
  echo "Place the QFI image in the repo root named 'qfi.png' or pass the path: ./scripts/set-icons.sh path/to/image.png"
  exit 1
fi

mkdir -p "$OUT_DIR"

resize_with_sips() {
  local src=$1
  local size=$2
  local out=$3
  sips -z "$size" "$size" "$src" --out "$out" >/dev/null
}

resize_with_magick() {
  local src=$1
  local size=$2
  local out=$3
  # use magick if available (ImageMagick v7+) or convert (v6)
  if command -v magick >/dev/null 2>&1; then
    magick "$src" -resize "${size}x${size}" "$out"
  else
    convert "$src" -resize "${size}x${size}" "$out"
  fi
}

do_resize() {
  local src=$1; shift
  local size=$1; shift
  local out=$1; shift
  if command -v sips >/dev/null 2>&1; then
    resize_with_sips "$src" "$size" "$out"
  elif command -v magick >/dev/null 2>&1 || command -v convert >/dev/null 2>&1; then
    resize_with_magick "$src" "$size" "$out"
  else
    echo "No supported image resizer found. Install ImageMagick (brew install imagemagick) or use macOS sips."
    exit 2
  fi
}

echo "Using source image: $SRC"

do_resize "$SRC" 192 "$OUT_DIR/icon-192.png"
echo "Wrote $OUT_DIR/icon-192.png"

do_resize "$SRC" 512 "$OUT_DIR/icon-512.png"
echo "Wrote $OUT_DIR/icon-512.png"

echo "Done. If you want a .ico favicon as well, you can run:\n  convert $OUT_DIR/icon-192.png -define icon:auto-resize=64,48,32,16 $OUT_DIR/favicon.ico\n(or use 'magick' instead of 'convert' on ImageMagick v7)."
