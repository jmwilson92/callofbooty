#!/usr/bin/env bash
# Build FPS weapon GLBs: Imagine refs + Blender low-poly meshes.
# Requires: blender on PATH (./tools/install_blender.sh)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF_DIR="public/assets/refs/weapons"
OUT_DIR="public/assets/models/weapons"
CATALOG="public/assets/weapons_catalog.json"

mkdir -p "$REF_DIR" "$OUT_DIR"

WEAPONS=(ar smg lmg sniper dmr shotgun pistol)

if ! command -v blender >/dev/null 2>&1; then
  echo "ERROR: blender not on PATH. Run: ./tools/install_blender.sh"
  echo "       then: export PATH=\"\$HOME/.local/bin:\$PATH\""
  exit 1
fi

echo "==> Exporting weapons with Blender $(blender --version | head -1)..."
for name in "${WEAPONS[@]}"; do
  ref="${REF_DIR}/${name}_ref.jpg"
  out="${OUT_DIR}/${name}.glb"
  if [[ -f "$ref" ]]; then
    blender --background --python tools/blender/export_weapon.py -- \
      --name "$name" --ref "$ref" --out "$out"
  else
    echo "  (no ref for $name — mesh only)"
    blender --background --python tools/blender/export_weapon.py -- \
      --name "$name" --out "$out"
  fi
done

# Write catalog
python3 - <<'PY'
import json
from pathlib import Path
root = Path("public/assets")
weapons = {}
for name in ["ar", "smg", "lmg", "sniper", "dmr", "shotgun", "pistol"]:
    glb = root / "models" / "weapons" / f"{name}.glb"
    ref = root / "refs" / "weapons" / f"{name}_ref.jpg"
    if glb.exists():
        weapons[name] = {
            "glb": f"assets/models/weapons/{name}.glb",
            "ref": f"assets/refs/weapons/{name}_ref.jpg" if ref.exists() else None,
            "source": "Imagine ref + Blender export_weapon.py",
        }
Path("public/assets/weapons_catalog.json").write_text(json.dumps({"version": 1, "weapons": weapons}, indent=2) + "\n")
print(f"catalog -> public/assets/weapons_catalog.json ({len(weapons)} weapons)")
PY

echo "Done. Models in $OUT_DIR"
ls -la "$OUT_DIR"
