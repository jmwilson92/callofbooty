"""
Blender headless FPS weapon exporter — curved / beveled meshes.

Usage:
  blender --background --python tools/blender/export_weapon.py -- \
      --name ar --ref public/assets/refs/weapons/ar_ref.jpg \
      --out public/assets/models/weapons/ar.glb

Coordinate convention (Blender Z-up, before glTF Y-up export):
  +Y  = barrel FORWARD  →  three.js −Z after export_yup
  +Z  = UP              →  three.js +Y
  +X  = right

Origin near receiver; Sight empty on optic/iron axis for ADS alignment.
Empties: Sight, Muzzle, Mag (mesh named Mag stays separate for reload).
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

try:
    import bpy
    from mathutils import Vector, Euler, Matrix
except ImportError:
    print("Run inside Blender: blender --background --python export_weapon.py -- ...")
    sys.exit(1)


# ── scene helpers ──────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.objects):
        for block in list(coll):
            coll.remove(block)


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
        if emit > 0 and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*color[:3], 1.0)
    # Light ref tint only — heavy UV map made viewmodels look "funky"
    if image_path and Path(image_path).is_file():
        img = bpy.data.images.load(str(Path(image_path).resolve()))
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = img
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs["Factor"].default_value = 0.18
        mix.inputs["A"].default_value = (*color[:3], 1.0)
        links.new(tex.outputs["Color"], mix.inputs["B"])
        links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    return mat


def _apply_rot_loc(obj, loc, rot):
    obj.location = loc
    obj.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def smooth(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    if obj.data and hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(40)


def bevel(obj, width=0.004, segments=2):
    """Add a bevel modifier and apply — rounds sharp cube edges."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(30)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    smooth(obj)


def box(sx, sy, sz, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, name="box", do_bevel=True, bevel_w=0.003):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    _apply_rot_loc(obj, loc, rot)
    if mat:
        obj.data.materials.append(mat)
    if do_bevel:
        bevel(obj, width=bevel_w, segments=2)
    else:
        smooth(obj)
    return obj


def cyl(r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=16, mat=None, name="cyl",
        r2=None):
    """Cylinder along local Z; rot to aim. If r2 set, use cone (tapered)."""
    if r2 is not None and abs(r2 - r) > 1e-6:
        bpy.ops.mesh.primitive_cone_add(
            vertices=verts, radius1=r, radius2=r2, depth=depth, location=(0, 0, 0)
        )
    else:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=verts, radius=r, depth=depth, location=(0, 0, 0)
        )
    obj = bpy.context.active_object
    obj.name = name
    _apply_rot_loc(obj, loc, rot)
    if mat:
        obj.data.materials.append(mat)
    smooth(obj)
    return obj


def torus(major, minor, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, name="torus"):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=20, minor_segments=10,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = name
    _apply_rot_loc(obj, loc, rot)
    if mat:
        obj.data.materials.append(mat)
    smooth(obj)
    return obj


def empty(name, loc):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.empty_display_size = 0.04
    return obj


# Barrel aims +Y (forward). rot_x90 aims cylinder Z → Y.
RX90 = (math.radians(90), 0, 0)
RY90 = (0, math.radians(90), 0)


# ── weapon builders ────────────────────────────────────────────────────────

def build_ar(mats):
    dark, steel, body, glass, glow, skin = mats
    # Stock (behind = −Y)
    box(0.038, 0.13, 0.048, (0, -0.14, -0.015), mat=dark, name="stock", bevel_w=0.005)
    cyl(0.012, 0.09, (0, -0.05, -0.012), RX90, 12, dark, "buffer")
    # Lower / upper receiver
    box(0.052, 0.15, 0.048, (0, 0.02, -0.028), mat=body, name="lower", bevel_w=0.004)
    box(0.048, 0.17, 0.04, (0, 0.03, -0.002), mat=dark, name="upper", bevel_w=0.003)
    # Magwell lip
    box(0.05, 0.06, 0.02, (0, 0.02, -0.055), mat=steel, name="magwell", bevel_w=0.002)
    # Handguard (rounded feel via bevel)
    box(0.046, 0.2, 0.04, (0, 0.22, -0.008), mat=dark, name="handguard", bevel_w=0.004)
    # Barrel + gas block + muzzle
    cyl(0.008, 0.2, (0, 0.42, -0.004), RX90, 14, steel, "barrel")
    box(0.016, 0.028, 0.016, (0, 0.32, -0.004), mat=steel, name="gas", do_bevel=True, bevel_w=0.002)
    cyl(0.012, 0.03, (0, 0.54, -0.004), RX90, 10, steel, "flash_hider", r2=0.014)
    # Rail
    box(0.024, 0.2, 0.01, (0, 0.08, 0.022), mat=dark, name="rail", bevel_w=0.001)
    # Red-dot optic (rounded housing)
    box(0.036, 0.05, 0.028, (0, 0.02, 0.042), mat=dark, name="optic_base", bevel_w=0.003)
    # Window frame + glass
    box(0.03, 0.008, 0.03, (0, 0.04, 0.055), mat=glass, name="optic_glass", do_bevel=False)
    box(0.007, 0.006, 0.007, (0, 0.038, 0.055), mat=glow, name="reticle", do_bevel=False)
    # Pistol grip
    box(0.036, 0.045, 0.1, (0, -0.01, -0.1), rot=(math.radians(18), 0, 0),
        mat=dark, name="grip", bevel_w=0.005)
    # Magazine (separate object name Mag)
    box(0.038, 0.048, 0.13, (0, 0.02, -0.13), mat=body, name="Mag", bevel_w=0.003)
    # Hands
    box(0.042, 0.055, 0.042, (0.02, -0.01, -0.12), mat=skin, name="hand_fire", bevel_w=0.006)
    box(0.04, 0.05, 0.04, (0.0, 0.2, -0.055), mat=skin, name="hand_support", bevel_w=0.006)

    empty("Sight", (0, 0.03, 0.055))
    empty("Muzzle", (0, 0.56, -0.004))
    empty("Mag", (0, 0.02, -0.13))


def build_smg(mats):
    dark, steel, body, glass, glow, skin = mats
    box(0.048, 0.18, 0.045, (0, 0.02, -0.018), mat=body, name="receiver", bevel_w=0.004)
    box(0.042, 0.1, 0.036, (0, 0.16, -0.008), mat=dark, name="shroud", bevel_w=0.003)
    cyl(0.009, 0.12, (0, 0.28, -0.004), RX90, 14, steel, "barrel")
    cyl(0.012, 0.025, (0, 0.35, -0.004), RX90, 10, steel, "muzzle_dev")
    box(0.038, 0.09, 0.038, (0, -0.12, -0.015), mat=dark, name="stock", bevel_w=0.004)
    box(0.036, 0.042, 0.09, (0, -0.02, -0.095), rot=(math.radians(14), 0, 0),
        mat=dark, name="grip", bevel_w=0.004)
    box(0.036, 0.042, 0.11, (0, 0.02, -0.12), mat=body, name="Mag", bevel_w=0.003)
    box(0.018, 0.12, 0.008, (0, 0.05, 0.018), mat=dark, name="rail", bevel_w=0.001)
    # Compact irons
    box(0.004, 0.004, 0.012, (0, 0.18, 0.03), mat=glow, name="front_sight", do_bevel=False)
    box(0.016, 0.006, 0.01, (0, -0.02, 0.024), mat=dark, name="rear_sight", bevel_w=0.001)
    box(0.04, 0.05, 0.04, (0.015, -0.02, -0.11), mat=skin, name="hand_fire", bevel_w=0.005)
    box(0.038, 0.045, 0.038, (0, 0.14, -0.05), mat=skin, name="hand_support", bevel_w=0.005)
    empty("Sight", (0, 0.08, 0.028))
    empty("Muzzle", (0, 0.38, -0.004))
    empty("Mag", (0, 0.02, -0.12))


def build_lmg(mats):
    dark, steel, body, glass, glow, skin = mats
    box(0.062, 0.3, 0.052, (0, 0.02, -0.015), mat=dark, name="receiver", bevel_w=0.005)
    cyl(0.012, 0.32, (0, 0.34, -0.002), RX90, 14, steel, "barrel")
    cyl(0.016, 0.04, (0, 0.52, -0.002), RX90, 12, steel, "muzzle_dev")
    box(0.068, 0.1, 0.075, (0, 0.0, -0.09), mat=body, name="Mag", bevel_w=0.004)
    box(0.042, 0.045, 0.095, (0, -0.1, -0.095), rot=(math.radians(12), 0, 0),
        mat=dark, name="grip", bevel_w=0.004)
    box(0.048, 0.13, 0.048, (0, -0.2, -0.012), mat=dark, name="stock", bevel_w=0.004)
    # Bipod legs (cylinders)
    cyl(0.006, 0.1, (-0.04, 0.28, -0.07), (math.radians(70), 0, math.radians(-10)), 8, steel, "bipod_l")
    cyl(0.006, 0.1, (0.04, 0.28, -0.07), (math.radians(70), 0, math.radians(10)), 8, steel, "bipod_r")
    box(0.005, 0.005, 0.014, (0, 0.2, 0.03), mat=glow, name="front_sight", do_bevel=False)
    box(0.04, 0.05, 0.04, (0.015, -0.1, -0.11), mat=skin, name="hand_fire", bevel_w=0.005)
    empty("Sight", (0, 0.05, 0.028))
    empty("Muzzle", (0, 0.55, -0.002))
    empty("Mag", (0, 0.0, -0.09))


def build_sniper(mats):
    dark, steel, body, glass, glow, skin = mats
    wood = make_mat("wood", (0.38, 0.24, 0.13), 0.04, 0.72)
    box(0.048, 0.26, 0.048, (0, 0.0, -0.015), mat=dark, name="receiver", bevel_w=0.004)
    box(0.05, 0.18, 0.055, (0, -0.18, -0.02), mat=wood, name="stock", bevel_w=0.006)
    # Cheek riser
    box(0.04, 0.1, 0.025, (0, -0.2, 0.02), mat=dark, name="cheek", bevel_w=0.003)
    cyl(0.009, 0.4, (0, 0.35, -0.002), RX90, 14, steel, "barrel")
    cyl(0.014, 0.035, (0, 0.56, -0.002), RX90, 12, steel, "brake")
    # Scope tube (main + bells)
    cyl(0.018, 0.18, (0, 0.02, 0.042), RX90, 16, dark, "scope")
    cyl(0.022, 0.04, (0, -0.08, 0.042), RX90, 14, dark, "ocular", r2=0.016)
    cyl(0.024, 0.04, (0, 0.12, 0.042), RX90, 14, dark, "objective", r2=0.016)
    box(0.028, 0.008, 0.028, (0, -0.1, 0.042), mat=glass, name="ocular_glass", do_bevel=False)
    box(0.005, 0.005, 0.005, (0, 0.02, 0.042), mat=glow, name="reticle", do_bevel=False)
    # Mount rings
    box(0.02, 0.02, 0.02, (0, -0.02, 0.022), mat=steel, name="ring1", bevel_w=0.002)
    box(0.02, 0.02, 0.02, (0, 0.06, 0.022), mat=steel, name="ring2", bevel_w=0.002)
    box(0.038, 0.042, 0.09, (0, -0.05, -0.095), rot=(math.radians(10), 0, 0),
        mat=dark, name="grip", bevel_w=0.004)
    box(0.032, 0.04, 0.08, (0, 0.0, -0.1), mat=body, name="Mag", bevel_w=0.003)
    box(0.04, 0.048, 0.04, (0.015, -0.05, -0.11), mat=skin, name="hand_fire", bevel_w=0.005)
    empty("Sight", (0, 0.02, 0.042))
    empty("Muzzle", (0, 0.58, -0.002))
    empty("Mag", (0, 0.0, -0.1))


def build_dmr(mats):
    dark, steel, body, glass, glow, skin = mats
    od = make_mat("od", (0.3, 0.36, 0.22), 0.18, 0.52)
    box(0.042, 0.12, 0.048, (0, -0.14, -0.015), mat=od, name="stock", bevel_w=0.005)
    box(0.052, 0.16, 0.048, (0, 0.0, -0.028), mat=od, name="lower", bevel_w=0.004)
    box(0.048, 0.18, 0.04, (0, 0.02, -0.002), mat=dark, name="upper", bevel_w=0.003)
    box(0.046, 0.22, 0.038, (0, 0.22, -0.008), mat=od, name="handguard", bevel_w=0.004)
    cyl(0.0085, 0.26, (0, 0.45, -0.004), RX90, 14, steel, "barrel")
    cyl(0.013, 0.032, (0, 0.6, -0.004), RX90, 10, steel, "muzzle")
    # LPVO-style scope
    cyl(0.015, 0.14, (0, 0.02, 0.04), RX90, 14, dark, "scope")
    box(0.024, 0.008, 0.024, (0, -0.05, 0.04), mat=glass, name="glass", do_bevel=False)
    box(0.005, 0.005, 0.005, (0, 0.02, 0.04), mat=glow, name="reticle", do_bevel=False)
    box(0.036, 0.042, 0.1, (0, -0.02, -0.1), rot=(math.radians(15), 0, 0),
        mat=dark, name="grip", bevel_w=0.004)
    box(0.038, 0.045, 0.12, (0, 0.0, -0.125), mat=body, name="Mag", bevel_w=0.003)
    box(0.04, 0.05, 0.04, (0.015, -0.02, -0.12), mat=skin, name="hand_fire", bevel_w=0.005)
    box(0.038, 0.045, 0.038, (0, 0.18, -0.05), mat=skin, name="hand_support", bevel_w=0.005)
    empty("Sight", (0, 0.02, 0.04))
    empty("Muzzle", (0, 0.62, -0.004))
    empty("Mag", (0, 0.0, -0.125))


def build_shotgun(mats):
    dark, steel, body, glass, glow, skin = mats
    wood = make_mat("wood", (0.42, 0.26, 0.14), 0.04, 0.75)
    box(0.048, 0.15, 0.052, (0, -0.14, -0.02), mat=wood, name="stock", bevel_w=0.006)
    box(0.052, 0.18, 0.052, (0, 0.02, -0.015), mat=dark, name="receiver", bevel_w=0.004)
    # Pump forend
    box(0.046, 0.11, 0.042, (0, 0.18, -0.02), mat=wood, name="Mag", bevel_w=0.005)
    cyl(0.013, 0.32, (0, 0.36, 0.002), RX90, 14, steel, "barrel")
    cyl(0.01, 0.26, (0, 0.32, -0.028), RX90, 12, steel, "tube")
    # Bead
    cyl(0.004, 0.012, (0, 0.4, 0.028), (0, 0, 0), 8, glow, "bead")
    box(0.038, 0.042, 0.09, (0, -0.02, -0.095), rot=(math.radians(10), 0, 0),
        mat=dark, name="grip", bevel_w=0.004)
    box(0.04, 0.05, 0.04, (0.015, -0.02, -0.11), mat=skin, name="hand_fire", bevel_w=0.005)
    box(0.038, 0.045, 0.038, (0, 0.18, -0.055), mat=skin, name="hand_support", bevel_w=0.005)
    empty("Sight", (0, 0.38, 0.028))
    empty("Muzzle", (0, 0.53, 0.002))
    empty("Mag", (0, 0.18, -0.02))


def build_pistol(mats):
    dark, steel, body, glass, glow, skin = mats
    # Slide (beveled steel)
    box(0.032, 0.16, 0.036, (0, 0.04, 0.002), mat=steel, name="slide", bevel_w=0.003)
    box(0.03, 0.12, 0.028, (0, 0.02, -0.022), mat=dark, name="frame", bevel_w=0.003)
    box(0.034, 0.042, 0.1, (0, -0.04, -0.085), rot=(math.radians(12), 0, 0),
        mat=dark, name="grip", bevel_w=0.005)
    cyl(0.007, 0.05, (0, 0.14, 0.0), RX90, 12, steel, "barrel")
    box(0.028, 0.036, 0.085, (0, -0.03, -0.09), mat=body, name="Mag", bevel_w=0.002)
    # Irons
    box(0.0035, 0.0035, 0.01, (0, 0.1, 0.024), mat=glow, name="front_sight", do_bevel=False)
    box(0.014, 0.005, 0.008, (0, -0.02, 0.022), mat=dark, name="rear_sight", bevel_w=0.001)
    # Trigger guard as thin torus-ish boxes
    box(0.008, 0.04, 0.035, (0, 0.02, -0.05), mat=dark, name="trig_guard", bevel_w=0.002)
    box(0.04, 0.05, 0.04, (0.01, -0.04, -0.1), mat=skin, name="hand_fire", bevel_w=0.006)
    empty("Sight", (0, 0.04, 0.024))
    empty("Muzzle", (0, 0.17, 0.0))
    empty("Mag", (0, -0.03, -0.09))


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
        smooth(joined)
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
        smooth(mag)
    return joined, mag


def parent_attachments(mesh, mag_mesh):
    if not mesh:
        return
    for name in ("Muzzle", "Sight"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.parent = mesh
            obj.matrix_parent_inverse = mesh.matrix_world.inverted()
    if mag_mesh:
        mag_mesh.parent = mesh
        mag_mesh.matrix_parent_inverse = mesh.matrix_world.inverted()
    mag_empty = bpy.data.objects.get("Mag")
    if mag_empty and mag_empty.type == "EMPTY":
        parent = mag_mesh or mesh
        mag_empty.parent = parent
        mag_empty.matrix_parent_inverse = parent.matrix_world.inverted()


def main():
    args = parse_args(sys.argv)
    clear_scene()
    ref = args.ref
    base = BASE_COLORS[args.name]
    dark = make_mat("dark", (0.07, 0.08, 0.09), 0.55, 0.38, ref)
    steel = make_mat("steel", (0.58, 0.6, 0.64), 0.88, 0.25, ref)
    body = make_mat("body", base, 0.28, 0.48, ref)
    glass = make_mat("glass", (0.3, 0.5, 0.6), 0.1, 0.12, None, emit=0.2)
    glow = make_mat("glow", (1.0, 0.18, 0.12), 0.05, 0.25, None, emit=1.4)
    skin = make_mat("skin", (0.76, 0.58, 0.42), 0.02, 0.88)

    BUILDERS[args.name]((dark, steel, body, glass, glow, skin))

    mesh, mag_mesh = join_meshes()
    parent_attachments(mesh, mag_mesh)

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
