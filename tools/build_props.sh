#!/usr/bin/env bash
# Build prop GLBs for Call of Booty.
# 1) Always runs the pure-Python placeholder generator.
# 2) If Blender is on PATH, re-exports each prop with the Imagine reference texture.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Generating placeholder GLBs (pygltflib)..."
python3 tools/gen_props.py

if command -v blender >/dev/null 2>&1; then
  echo "==> Blender found — re-exporting with Imagine refs..."
  for name in crate barrel traffic_cone dumpster fire_hydrant bollard newsbox palm_tree; do
    ref="public/assets/refs/${name}_ref.jpg"
    out="public/assets/models/${name}.glb"
    if [[ -f "$ref" ]]; then
      blender --background --python tools/blender/export_prop.py -- \
        --name "$name" --ref "$ref" --out "$out"
    else
      blender --background --python tools/blender/export_prop.py -- \
        --name "$name" --out "$out"
    fi
  done
else
  echo "==> Blender not installed — kept Python GLBs."
  echo "    Install Blender and re-run this script for higher-quality meshes:"
  echo "      https://www.blender.org/download/"
  echo "    Then: blender --background --python tools/blender/export_prop.py -- \\"
  echo "      --name crate --ref public/assets/refs/crate_ref.jpg --out public/assets/models/crate.glb"
fi

echo "Done. Models in public/assets/models/  catalog in public/assets/catalog.json"
