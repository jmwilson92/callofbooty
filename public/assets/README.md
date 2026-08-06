# Call of Booty — World Assets

Pipeline for map props and environment objects. Served by Vite from `public/`.

## Folders

| Path | Purpose |
|------|---------|
| `refs/` | Imagine concept / modeling reference images |
| `models/` | Final playable `.glb` (Y-up, meters) |
| `textures/` | Optional albedo/normal maps |
| `catalog.json` | Registry of prop names → paths + collision sizes |

## Workflow (Imagine → Blender → game)

1. **Concept (Imagine / Grok)**  
   Generate a clean three-quarter reference on a neutral background. Save as  
   `public/assets/refs/<name>_ref.jpg`.

2. **Mesh (Blender)**  
   Either run the headless builder:
   ```bash
   blender --background --python tools/blender/export_prop.py -- \
     --name crate --ref public/assets/refs/crate_ref.jpg \
     --out public/assets/models/crate.glb
   ```
   Or model by hand using the ref image, then export glTF 2.0 (.glb).

3. **Batch rebuild**
   ```bash
   ./tools/build_props.sh
   ```
   Always writes Python placeholder GLBs; upgrades them if `blender` is on `PATH`.

4. **Use in game**  
   Loaded by `src/world/Assets.js` at boot and scattered with AABB collision.

## Current kit

crate · barrel · traffic_cone · dumpster · fire_hydrant · bollard · newsbox · palm_tree

## Conventions

- **Units:** 1 unit = 1 meter  
- **Up axis:** +Y  
- **Origin:** feet at y=0, centered in XZ  
- **Collision:** `catalog.json` `collision: [sx, sy, sz]` full extents for AABB
