"""
Blender headless FPS weapon exporter for Call of Booty.

Usage:
  blender --background --python tools/blender/export_weapon.py -- \
      --name ar --ref public/assets/refs/weapons/ar_ref.jpg \
      --out public/assets/models/weapons/ar.glb

Builds a detailed low-poly viewmodel-oriented weapon (Y-up glTF):
  - Barrel aims −Z in three.js (Blender +Y before export_yup)
  - Sight line near local origin for ADS
  - Empties: Mag, Muzzle, Sight (attachment points)
  - Imagine ref used as albedo tint / baked look on materials

Units: meters. Origin near grip / receiver.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

try:
    import bpy
    from mathutils import Vector, Euler
except ImportError:
    print("Run inside Blender: blender --background --python export_weapon.py -- ...")
    sys.exit(1)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)
    for block in list(bpy.data.images):
        bpy.data.images.remove(block)
    for block in list(bpy.data.objects):
        bpy.data.objects.remove(block, do_unlink=True)


def make_mat(name, color, metal=0.35, rough=0.45, image_path=None, emit=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*color[:3], 1.0)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = emit
    if image_path and Path(image_path).is_file():
        img = bpy.data.images.load(str(Path(image_path).resolve()))
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = img
        # Mix photo ref with solid color so low-poly UVs still read
        mix = nodes.new("ShaderNodeMixRGB")
        mix.inputs["Fac"].default_value = 0.55
        mix.inputs["Color1"].default_value = (*color[:3], 1.0)
        links.new(tex.outputs["Color"], mix.inputs["Color2"])
        links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def cube(size=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), mat=None, name="cube"):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    obj.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if mat:
        obj.data.materials.append(mat)
    return obj


def cyl(r=0.05, depth=0.2, loc=(0, 0, 0), rot=(0, 0, 0), verts=12, mat=None, name="cyl"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if mat:
        obj.data.materials.append(mat)
    return obj


def empty(name, loc):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.empty_display_size = 0.05
    return obj


# Blender coords: +Y = barrel forward (→ three.js −Z after yup), +Z = up (→ three.js +Y)
# Sight plane ~ Z=0.04, receiver under it. Grip below −Z.


def build_ar(mats):
    dark, steel, body, glass, glow = mats
    # Stock
    cube((0.04, 0.14, 0.05), (0, 0.12, -0.02), mat=dark, name="stock")
    cyl(0.012, 0.1, (0, 0.04, -0.015), rot=(math.radians(90), 0, 0), mat=dark, name="buffer")
    # Receivers
    cube((0.055, 0.16, 0.05), (0, -0.02, -0.03), mat=body, name="lower")
    cube((0.05, 0.18, 0.042), (0, -0.04, -0.005), mat=dark, name="upper")
    # Handguard
    cube((0.048, 0.22, 0.042), (0, -0.24, -0.01), mat=dark, name="handguard")
    # Barrel
    cyl(0.009, 0.22, (0, -0.45, -0.005), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    cube((0.02, 0.035, 0.02), (0, -0.56, -0.005), mat=steel, name="muzzle")
    # Rail + red-dot
    cube((0.028, 0.22, 0.012), (0, -0.08, 0.02), mat=dark, name="rail")
    cube((0.04, 0.055, 0.03), (0, -0.02, 0.045), mat=dark, name="optic_base")
    cube((0.032, 0.012, 0.032), (0, -0.005, 0.055), mat=glass, name="optic_glass")
    cube((0.008, 0.008, 0.008), (0, -0.005, 0.055), mat=glow, name="reticle")
    # Grip + mag
    cube((0.04, 0.05, 0.11), (0, 0.02, -0.1), rot=(math.radians(18), 0, 0), mat=dark, name="grip")
    cube((0.04, 0.05, 0.14), (0, -0.04, -0.14), mat=body, name="mag")
    # Hands hint blocks (optional cosmetic)
    cube((0.045, 0.06, 0.045), (0.01, 0.04, -0.12), mat=make_mat("skin", (0.75, 0.58, 0.42), 0.02, 0.85), name="hand_fire")
    cube((0.045, 0.055, 0.045), (0.0, -0.22, -0.06), mat=make_mat("skin2", (0.75, 0.58, 0.42), 0.02, 0.85), name="hand_support")
    empty("Sight", (0, -0.02, 0.055))
    empty("Muzzle", (0, -0.58, -0.005))
    empty("Mag", (0, -0.04, -0.14))


def build_smg(mats):
    dark, steel, body, glass, glow = mats
    cube((0.05, 0.2, 0.048), (0, -0.06, -0.02), mat=body, name="receiver")
    cube((0.045, 0.12, 0.035), (0, -0.22, -0.01), mat=dark, name="shroud")
    cyl(0.01, 0.14, (0, -0.34, -0.005), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    cube((0.04, 0.08, 0.04), (0, 0.1, -0.02), mat=dark, name="stock")
    cube((0.04, 0.05, 0.1), (0, 0.02, -0.1), rot=(math.radians(15), 0, 0), mat=dark, name="grip")
    cube((0.038, 0.045, 0.12), (0, -0.04, -0.13), mat=body, name="mag")
    cube((0.02, 0.12, 0.008), (0, -0.08, 0.018), mat=dark, name="rail")
    cube((0.005, 0.005, 0.014), (0, -0.2, 0.03), mat=glow, name="front_sight")
    cube((0.018, 0.006, 0.01), (0, 0.0, 0.025), mat=dark, name="rear_sight")
    empty("Sight", (0, -0.1, 0.03))
    empty("Muzzle", (0, -0.42, -0.005))
    empty("Mag", (0, -0.04, -0.13))


def build_lmg(mats):
    dark, steel, body, glass, glow = mats
    cube((0.065, 0.32, 0.055), (0, -0.08, -0.02), mat=dark, name="receiver")
    cyl(0.014, 0.36, (0, -0.42, -0.005), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    cube((0.07, 0.1, 0.08), (0, -0.05, -0.1), mat=body, name="mag_box")
    cube((0.045, 0.05, 0.1), (0, 0.08, -0.1), rot=(math.radians(12), 0, 0), mat=dark, name="grip")
    cube((0.05, 0.14, 0.05), (0, 0.16, -0.02), mat=dark, name="stock")
    # bipod
    cube((0.01, 0.01, 0.1), (-0.04, -0.35, -0.08), rot=(math.radians(25), 0, 0), mat=steel, name="bipod_l")
    cube((0.01, 0.01, 0.1), (0.04, -0.35, -0.08), rot=(math.radians(25), 0, 0), mat=steel, name="bipod_r")
    cube((0.005, 0.005, 0.016), (0, -0.25, 0.03), mat=glow, name="front_sight")
    empty("Sight", (0, -0.1, 0.025))
    empty("Muzzle", (0, -0.62, -0.005))
    empty("Mag", (0, -0.05, -0.1))


def build_sniper(mats):
    dark, steel, body, glass, glow = mats
    wood = make_mat("wood", (0.35, 0.22, 0.12), 0.05, 0.7)
    cube((0.05, 0.28, 0.05), (0, -0.05, -0.02), mat=dark, name="receiver")
    cube((0.05, 0.18, 0.055), (0, 0.14, -0.025), mat=wood, name="stock")
    cyl(0.01, 0.42, (0, -0.42, -0.005), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    # Scope on sight axis
    cyl(0.02, 0.2, (0, -0.06, 0.04), rot=(math.radians(90), 0, 0), mat=dark, name="scope")
    cyl(0.022, 0.04, (0, 0.06, 0.04), rot=(math.radians(90), 0, 0), mat=dark, name="ocular")
    cube((0.03, 0.01, 0.03), (0, 0.08, 0.04), mat=glass, name="ocular_glass")
    cyl(0.024, 0.04, (0, -0.18, 0.04), rot=(math.radians(90), 0, 0), mat=dark, name="objective")
    cube((0.006, 0.006, 0.006), (0, -0.06, 0.04), mat=glow, name="reticle")
    cube((0.04, 0.05, 0.1), (0, 0.04, -0.1), rot=(math.radians(10), 0, 0), mat=dark, name="grip")
    cube((0.035, 0.04, 0.09), (0, -0.04, -0.1), mat=body, name="mag")
    empty("Sight", (0, -0.06, 0.04))
    empty("Muzzle", (0, -0.64, -0.005))
    empty("Mag", (0, -0.04, -0.1))


def build_dmr(mats):
    # Similar to AR with longer barrel + magnified optic
    dark, steel, body, glass, glow = mats
    body_od = make_mat("od", (0.28, 0.35, 0.22), 0.15, 0.55)
    cube((0.05, 0.14, 0.05), (0, 0.12, -0.02), mat=body_od, name="stock")
    cube((0.055, 0.18, 0.05), (0, -0.02, -0.03), mat=body_od, name="lower")
    cube((0.05, 0.2, 0.042), (0, -0.06, -0.005), mat=dark, name="upper")
    cube((0.048, 0.24, 0.04), (0, -0.28, -0.01), mat=body_od, name="handguard")
    cyl(0.009, 0.28, (0, -0.5, -0.005), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    cube((0.02, 0.04, 0.02), (0, -0.65, -0.005), mat=steel, name="muzzle")
    # Scope
    cyl(0.016, 0.16, (0, -0.05, 0.04), rot=(math.radians(90), 0, 0), mat=dark, name="scope")
    cube((0.024, 0.008, 0.024), (0, 0.04, 0.04), mat=glass, name="glass")
    cube((0.005, 0.005, 0.005), (0, -0.05, 0.04), mat=glow, name="reticle")
    cube((0.04, 0.05, 0.11), (0, 0.02, -0.1), rot=(math.radians(16), 0, 0), mat=dark, name="grip")
    cube((0.04, 0.05, 0.12), (0, -0.04, -0.13), mat=body, name="mag")
    empty("Sight", (0, -0.05, 0.04))
    empty("Muzzle", (0, -0.68, -0.005))
    empty("Mag", (0, -0.04, -0.13))


def build_shotgun(mats):
    dark, steel, body, glass, glow = mats
    wood = make_mat("wood", (0.4, 0.25, 0.14), 0.04, 0.75)
    cube((0.05, 0.16, 0.055), (0, 0.12, -0.025), mat=wood, name="stock")
    cube((0.055, 0.2, 0.055), (0, -0.05, -0.02), mat=dark, name="receiver")
    cube((0.048, 0.12, 0.045), (0, -0.22, -0.025), mat=wood, name="forend")
    cyl(0.014, 0.34, (0, -0.42, 0.0), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    cyl(0.01, 0.28, (0, -0.38, -0.03), rot=(math.radians(90), 0, 0), mat=steel, name="tube")
    cube((0.006, 0.006, 0.014), (0, -0.35, 0.025), mat=glow, name="bead")
    cube((0.04, 0.05, 0.1), (0, 0.02, -0.1), rot=(math.radians(12), 0, 0), mat=dark, name="grip")
    empty("Sight", (0, -0.3, 0.025))
    empty("Muzzle", (0, -0.6, 0.0))
    empty("Mag", (0, -0.22, -0.025))  # pump / forend acts as mag group for anim


def build_pistol(mats):
    dark, steel, body, glass, glow = mats
    cube((0.035, 0.18, 0.04), (0, -0.08, 0.0), mat=steel, name="slide")
    cube((0.034, 0.14, 0.03), (0, -0.05, -0.025), mat=dark, name="frame")
    cube((0.038, 0.05, 0.11), (0, 0.02, -0.09), rot=(math.radians(12), 0, 0), mat=dark, name="grip")
    cyl(0.008, 0.06, (0, -0.2, 0.0), rot=(math.radians(90), 0, 0), mat=steel, name="barrel")
    cube((0.03, 0.04, 0.09), (0, 0.0, -0.1), mat=body, name="mag")
    cube((0.004, 0.004, 0.012), (0, -0.16, 0.025), mat=glow, name="front_sight")
    cube((0.016, 0.005, 0.008), (0, -0.02, 0.022), mat=dark, name="rear_sight")
    empty("Sight", (0, -0.09, 0.025))
    empty("Muzzle", (0, -0.24, 0.0))
    empty("Mag", (0, 0.0, -0.1))


BUILDERS = {
    "ar": build_ar,
    "smg": build_smg,
    "lmg": build_lmg,
    "sniper": build_sniper,
    "dmr": build_dmr,
    "shotgun": build_shotgun,
    "pistol": build_pistol,
}

BASE_COLORS = {
    "ar": (0.22, 0.24, 0.22),
    "smg": (0.45, 0.38, 0.28),
    "lmg": (0.2, 0.28, 0.18),
    "sniper": (0.18, 0.22, 0.18),
    "dmr": (0.28, 0.35, 0.22),
    "shotgun": (0.25, 0.18, 0.12),
    "pistol": (0.15, 0.15, 0.16),
}


def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--name", required=True, choices=sorted(BUILDERS.keys()))
    p.add_argument("--ref", default=None)
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def join_meshes():
    """Join body meshes; keep 'mag' mesh separate for reload animation."""
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        return None, None
    body = [o for o in meshes if o.name.lower() != "mag"]
    mag_objs = [o for o in meshes if o.name.lower() == "mag"]
    joined = None
    if body:
        bpy.ops.object.select_all(action="DESELECT")
        for o in body:
            o.select_set(True)
        bpy.context.view_layer.objects.active = body[0]
        if len(body) > 1:
            bpy.ops.object.join()
        joined = bpy.context.active_object
        joined.name = "WeaponMesh"
    mag = None
    if mag_objs:
        bpy.ops.object.select_all(action="DESELECT")
        for o in mag_objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = mag_objs[0]
        if len(mag_objs) > 1:
            bpy.ops.object.join()
        mag = bpy.context.active_object
        mag.name = "Mag"
    return joined, mag


def parent_empties_to_mesh(mesh, mag_mesh=None):
    if not mesh:
        return
    for name in ("Muzzle", "Sight"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.parent = mesh
            obj.matrix_parent_inverse = mesh.matrix_world.inverted()
    # Mag empty: parent mag mesh to WeaponMesh if separate
    if mag_mesh and mesh:
        mag_mesh.parent = mesh
        mag_mesh.matrix_parent_inverse = mesh.matrix_world.inverted()
    mag_empty = bpy.data.objects.get("Mag")
    if mag_empty and mag_empty.type == "EMPTY" and mesh:
        if mag_mesh:
            mag_empty.parent = mag_mesh
            mag_empty.matrix_parent_inverse = mag_mesh.matrix_world.inverted()
        else:
            mag_empty.parent = mesh
            mag_empty.matrix_parent_inverse = mesh.matrix_world.inverted()


def main():
    args = parse_args(sys.argv)
    clear_scene()
    ref = args.ref
    base = BASE_COLORS[args.name]
    dark = make_mat("dark", (0.08, 0.09, 0.1), 0.55, 0.4, ref)
    steel = make_mat("steel", (0.55, 0.58, 0.62), 0.85, 0.28, ref)
    body = make_mat("body", base, 0.25, 0.5, ref)
    glass = make_mat("glass", (0.25, 0.45, 0.55), 0.1, 0.15, None, emit=0.15)
    glow = make_mat("glow", (1.0, 0.15, 0.12), 0.05, 0.3, None, emit=1.2)
    BUILDERS[args.name]((dark, steel, body, glass, glow))

    mesh, mag_mesh = join_meshes()
    parent_empties_to_mesh(mesh, mag_mesh)

    # Select everything for export
    bpy.ops.object.select_all(action="SELECT")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_extras=True,
        use_selection=False,
    )
    print(f"Exported weapon {args.name} -> {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
