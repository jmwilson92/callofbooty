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


def make_mat(name, color, metal=0.35, rough=0.45, image_path=None, emit=0.0, alpha=1.0):
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
    if alpha < 0.999:
        mat.blend_method = "BLEND"
        if hasattr(mat, "shadow_method"):
            mat.shadow_method = "NONE"
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = max(0.0, 1.0 - alpha)
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = max(0.0, 1.0 - alpha)
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = emit
        if emit > 0 and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*color[:3], 1.0)
    # Do NOT plaster the Imagine ref as a full UV wrap — unwrapped boxes look
    # like a photo sticker. Geometry + solid PBR colors match the ref look.
    # Optional: very light average-color bias only if we ever sample refs.
    _ = image_path  # reserved for future atlas baking
    return mat


def red_dot_optic(dark, glass, glow, y=0.04, z_along=0.02):
    """Open micro red-dot: thin frame only — center must stay empty for ADS."""
    # Low mount under the optic (not on aim line)
    box(0.028, 0.04, 0.01, (0, z_along, y - 0.014), mat=dark, name="optic_mount", bevel_w=0.002)
    # Thin rectangular window frame (no solid tube)
    t = 0.003  # frame thickness
    s = 0.028  # outer half-ish size
    h = 0.026  # frame height
    # Front ring pieces (looking down +Y)
    box(s, t, t, (0, z_along + 0.012, y + h * 0.5), mat=dark, name="od_top", do_bevel=False)
    box(s, t, t, (0, z_along + 0.012, y - h * 0.5), mat=dark, name="od_bot", do_bevel=False)
    box(t, t, h, (-s * 0.5, z_along + 0.012, y), mat=dark, name="od_l", do_bevel=False)
    box(t, t, h, (s * 0.5, z_along + 0.012, y), mat=dark, name="od_r", do_bevel=False)
    # Side walls (thin, don't fill the hole)
    box(t, 0.02, h * 0.9, (-s * 0.48, z_along, y), mat=dark, name="od_sl", do_bevel=False)
    box(t, 0.02, h * 0.9, (s * 0.48, z_along, y), mat=dark, name="od_sr", do_bevel=False)
    # Tiny reticle only (what you aim with)
    box(0.004, 0.003, 0.004, (0, z_along + 0.008, y), mat=glow, name="reticle", do_bevel=False)
    # Optional ultra-thin glass (almost invisible)
    box(0.022, 0.002, 0.022, (0, z_along + 0.01, y), mat=glass, name="optic_glass", do_bevel=False)


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

def _hands(skin, fire_loc, support_loc=None):
    box(0.038, 0.048, 0.038, fire_loc, mat=skin, name="hand_fire", bevel_w=0.007)
    if support_loc:
        box(0.036, 0.044, 0.036, support_loc, mat=skin, name="hand_support", bevel_w=0.007)


def build_ar(mats):
    """Black modern carbine — matches ar_ref silhouette (stock, receiver, HG, red-dot)."""
    dark, steel, body, glass, glow, skin = mats
    polymer = body  # black polymer
    # Collapsible stock
    box(0.034, 0.1, 0.048, (0, -0.18, -0.01), mat=dark, name="stock", bevel_w=0.005)
    box(0.04, 0.035, 0.055, (0, -0.22, -0.005), mat=dark, name="stock_pad", bevel_w=0.004)
    # Cheek riser edge
    box(0.03, 0.05, 0.02, (0, -0.17, 0.02), mat=dark, name="stock_cheek", bevel_w=0.002)
    cyl(0.011, 0.1, (0, -0.08, -0.01), RX90, 14, dark, "buffer")
    # Lower / upper receivers (stepped AR look)
    box(0.048, 0.13, 0.05, (0, 0.01, -0.032), mat=polymer, name="lower", bevel_w=0.004)
    box(0.044, 0.15, 0.04, (0, 0.02, -0.002), mat=dark, name="upper", bevel_w=0.003)
    # Ejection port hint
    box(0.008, 0.04, 0.02, (0.024, 0.04, 0.0), mat=steel, name="ejection", bevel_w=0.001)
    # Magwell + mag
    box(0.046, 0.05, 0.02, (0, 0.01, -0.058), mat=steel, name="magwell", bevel_w=0.002)
    box(0.034, 0.042, 0.13, (0, 0.015, -0.13), mat=dark, name="Mag", bevel_w=0.003)
    box(0.036, 0.044, 0.012, (0, 0.015, -0.195), mat=polymer, name="mag_base", bevel_w=0.002)
    # Handguard (hex-ish via bevel + rails)
    box(0.042, 0.16, 0.038, (0, 0.17, -0.006), mat=dark, name="hg1", bevel_w=0.005)
    box(0.038, 0.1, 0.034, (0, 0.28, -0.004), mat=dark, name="hg2", bevel_w=0.004)
    # M-LOK slots suggestion
    for i, y in enumerate((0.14, 0.2, 0.26, 0.32)):
        box(0.02, 0.02, 0.006, (0, y, -0.024), mat=steel, name=f"mlok{i}", do_bevel=False)
    # Top rail continuous
    box(0.02, 0.28, 0.008, (0, 0.1, 0.02), mat=dark, name="rail", bevel_w=0.001)
    # Barrel + gas
    cyl(0.007, 0.2, (0, 0.44, -0.002), RX90, 16, steel, "barrel")
    cyl(0.012, 0.028, (0, 0.34, -0.002), RX90, 12, steel, "gas_block")
    box(0.008, 0.08, 0.008, (0, 0.18, 0.012), mat=steel, name="gas_tube", bevel_w=0.001)
    # A2-style flash hider
    cyl(0.011, 0.032, (0, 0.55, -0.002), RX90, 12, steel, "fh", r2=0.014)
    # Open red-dot
    red_dot_optic(dark, glass, glow, y=0.038, z_along=0.0)
    # Grip
    box(0.032, 0.04, 0.1, (0, -0.02, -0.1), rot=(math.radians(22), 0, 0),
        mat=dark, name="grip", bevel_w=0.006)
    # Trigger guard
    box(0.01, 0.04, 0.03, (0, 0.02, -0.06), mat=dark, name="tguard", bevel_w=0.002)
    _hands(skin, (0.016, -0.02, -0.12), (0.0, 0.22, -0.05))
    empty("Sight", (0, 0.0, 0.038))
    empty("Muzzle", (0, 0.58, -0.002))
    empty("Mag", (0, 0.015, -0.13))


def build_smg(mats):
    """Compact tan/FDE SMG — matches smg_ref."""
    dark, steel, body, glass, glow, skin = mats
    tan = body
    box(0.044, 0.15, 0.044, (0, 0.02, -0.014), mat=tan, name="receiver", bevel_w=0.005)
    box(0.04, 0.08, 0.036, (0, 0.12, -0.004), mat=dark, name="upper", bevel_w=0.003)
    # Short HG + vertical grip
    box(0.038, 0.1, 0.034, (0, 0.2, -0.004), mat=tan, name="hg", bevel_w=0.004)
    box(0.028, 0.04, 0.08, (0, 0.22, -0.06), mat=dark, name="vgrip", bevel_w=0.004)
    cyl(0.008, 0.1, (0, 0.3, -0.002), RX90, 14, steel, "barrel")
    cyl(0.012, 0.03, (0, 0.36, -0.002), RX90, 12, steel, "muzzle", r2=0.01)
    # Folding stock
    box(0.028, 0.07, 0.03, (0, -0.1, -0.008), mat=dark, name="stock", bevel_w=0.003)
    box(0.024, 0.04, 0.04, (0, -0.14, 0.0), mat=tan, name="stock_pad", bevel_w=0.003)
    box(0.032, 0.038, 0.09, (0, -0.02, -0.09), rot=(math.radians(14), 0, 0),
        mat=tan, name="grip", bevel_w=0.005)
    box(0.032, 0.038, 0.12, (0, 0.02, -0.125), mat=dark, name="Mag", bevel_w=0.003)
    box(0.016, 0.14, 0.007, (0, 0.06, 0.018), mat=dark, name="rail", bevel_w=0.001)
    # Flip-up irons
    box(0.003, 0.003, 0.012, (0, 0.2, 0.028), mat=glow, name="front_sight", do_bevel=False)
    box(0.012, 0.004, 0.01, (0, -0.02, 0.022), mat=dark, name="rear_sight", bevel_w=0.001)
    _hands(skin, (0.014, -0.02, -0.1), (0.0, 0.2, -0.06))
    empty("Sight", (0, 0.08, 0.026))
    empty("Muzzle", (0, 0.38, -0.002))
    empty("Mag", (0, 0.02, -0.125))


def build_lmg(mats):
    """OD LMG with box mag + bipod — matches lmg_ref."""
    dark, steel, body, glass, glow, skin = mats
    od = body
    box(0.056, 0.26, 0.052, (0, 0.02, -0.014), mat=od, name="receiver", bevel_w=0.006)
    box(0.05, 0.08, 0.04, (0, 0.1, 0.01), mat=dark, name="feed", bevel_w=0.003)
    # Long barrel + perforated jacket feel
    cyl(0.01, 0.32, (0, 0.36, -0.002), RX90, 16, steel, "barrel")
    for i, y in enumerate((0.2, 0.26, 0.32, 0.38, 0.44)):
        cyl(0.015, 0.01, (0, y, -0.002), RX90, 12, dark, f"jacket{i}")
    cyl(0.016, 0.04, (0, 0.54, -0.002), RX90, 12, steel, "muzzle_dev")
    # Box mag
    box(0.07, 0.1, 0.09, (0, 0.0, -0.1), mat=dark, name="Mag", bevel_w=0.005)
    box(0.038, 0.04, 0.09, (0, -0.1, -0.09), rot=(math.radians(12), 0, 0),
        mat=dark, name="grip", bevel_w=0.005)
    box(0.044, 0.12, 0.048, (0, -0.2, -0.01), mat=od, name="stock", bevel_w=0.005)
    # Carry handle
    box(0.012, 0.05, 0.05, (0, 0.04, 0.045), mat=dark, name="carry", bevel_w=0.003)
    cyl(0.0055, 0.12, (-0.04, 0.3, -0.08), (math.radians(65), 0, math.radians(-15)), 8, steel, "bipod_l")
    cyl(0.0055, 0.12, (0.04, 0.3, -0.08), (math.radians(65), 0, math.radians(15)), 8, steel, "bipod_r")
    box(0.004, 0.004, 0.012, (0, 0.18, 0.03), mat=glow, name="front_sight", do_bevel=False)
    _hands(skin, (0.014, -0.1, -0.1), (0.0, 0.18, -0.04))
    empty("Sight", (0, 0.05, 0.028))
    empty("Muzzle", (0, 0.58, -0.002))
    empty("Mag", (0, 0.0, -0.1))


def build_sniper(mats):
    """Bolt rifle + large scope — matches sniper_ref (OD chassis, black metal)."""
    dark, steel, body, glass, glow, skin = mats
    od = body
    wood = make_mat("wood", (0.32, 0.2, 0.12), 0.04, 0.75)
    box(0.044, 0.22, 0.048, (0, 0.0, -0.014), mat=dark, name="receiver", bevel_w=0.005)
    # Chassis / stock
    box(0.048, 0.18, 0.055, (0, -0.18, -0.02), mat=od, name="stock", bevel_w=0.007)
    box(0.04, 0.08, 0.035, (0, -0.22, 0.018), mat=od, name="cheek", bevel_w=0.004)
    box(0.038, 0.05, 0.06, (0, -0.2, -0.04), mat=wood, name="buttpad", bevel_w=0.004)
    # Bolt handle
    cyl(0.008, 0.05, (0.04, -0.02, 0.01), RY90, 8, steel, "bolt")
    box(0.02, 0.02, 0.03, (0.06, -0.02, 0.01), mat=dark, name="bolt_knob", bevel_w=0.002)
    # Long free-float barrel
    cyl(0.008, 0.45, (0, 0.38, -0.002), RX90, 16, steel, "barrel")
    cyl(0.012, 0.035, (0, 0.62, -0.002), RX90, 12, steel, "brake")
    # Big scope
    cyl(0.018, 0.18, (0, 0.02, 0.045), RX90, 18, dark, "scope")
    cyl(0.024, 0.05, (0, -0.09, 0.045), RX90, 14, dark, "ocular", r2=0.016)
    cyl(0.026, 0.05, (0, 0.13, 0.045), RX90, 14, dark, "objective", r2=0.016)
    cyl(0.012, 0.022, (0, 0.02, 0.065), (0, 0, 0), 10, dark, "turret_top")
    cyl(0.01, 0.02, (0.025, 0.02, 0.045), RY90, 10, dark, "turret_side")
    box(0.028, 0.006, 0.028, (0, -0.11, 0.045), mat=glass, name="ocular_glass", do_bevel=False)
    box(0.004, 0.004, 0.004, (0, 0.02, 0.045), mat=glow, name="reticle", do_bevel=False)
    box(0.02, 0.02, 0.016, (0, -0.03, 0.024), mat=steel, name="ring1", bevel_w=0.002)
    box(0.02, 0.02, 0.016, (0, 0.07, 0.024), mat=steel, name="ring2", bevel_w=0.002)
    # Bipod
    cyl(0.005, 0.1, (-0.03, 0.28, -0.07), (math.radians(55), 0, 0), 8, dark, "bipod_l")
    cyl(0.005, 0.1, (0.03, 0.28, -0.07), (math.radians(55), 0, 0), 8, dark, "bipod_r")
    box(0.034, 0.038, 0.085, (0, -0.05, -0.09), rot=(math.radians(8), 0, 0),
        mat=dark, name="grip", bevel_w=0.004)
    box(0.028, 0.036, 0.07, (0, 0.0, -0.1), mat=dark, name="Mag", bevel_w=0.003)
    _hands(skin, (0.014, -0.05, -0.1), (0.0, 0.2, -0.04))
    empty("Sight", (0, 0.02, 0.045))
    empty("Muzzle", (0, 0.64, -0.002))
    empty("Mag", (0, 0.0, -0.1))


def build_dmr(mats):
    """Olive DMR with LPVO — matches dmr_ref."""
    dark, steel, body, glass, glow, skin = mats
    od = body
    box(0.038, 0.11, 0.048, (0, -0.14, -0.012), mat=od, name="stock", bevel_w=0.005)
    box(0.048, 0.14, 0.048, (0, 0.0, -0.028), mat=od, name="lower", bevel_w=0.004)
    box(0.044, 0.16, 0.04, (0, 0.02, -0.002), mat=dark, name="upper", bevel_w=0.003)
    box(0.042, 0.14, 0.036, (0, 0.18, -0.006), mat=od, name="hg1", bevel_w=0.004)
    box(0.038, 0.1, 0.032, (0, 0.28, -0.004), mat=od, name="hg2", bevel_w=0.003)
    # Vertical grip
    box(0.028, 0.035, 0.07, (0, 0.22, -0.055), mat=dark, name="vgrip", bevel_w=0.003)
    cyl(0.0075, 0.26, (0, 0.48, -0.002), RX90, 16, steel, "barrel")
    cyl(0.012, 0.03, (0, 0.62, -0.002), RX90, 12, steel, "muzzle")
    # LPVO scope
    cyl(0.014, 0.14, (0, 0.02, 0.04), RX90, 16, dark, "scope")
    cyl(0.018, 0.03, (0, -0.06, 0.04), RX90, 12, dark, "oc", r2=0.012)
    cyl(0.018, 0.03, (0, 0.1, 0.04), RX90, 12, dark, "obj", r2=0.012)
    box(0.022, 0.006, 0.022, (0, -0.07, 0.04), mat=glass, name="glass", do_bevel=False)
    box(0.004, 0.004, 0.004, (0, 0.02, 0.04), mat=glow, name="reticle", do_bevel=False)
    box(0.032, 0.038, 0.095, (0, -0.02, -0.1), rot=(math.radians(15), 0, 0),
        mat=dark, name="grip", bevel_w=0.005)
    box(0.034, 0.04, 0.12, (0, 0.0, -0.13), mat=dark, name="Mag", bevel_w=0.003)
    _hands(skin, (0.014, -0.02, -0.115), (0.0, 0.2, -0.055))
    empty("Sight", (0, 0.02, 0.04))
    empty("Muzzle", (0, 0.64, -0.002))
    empty("Mag", (0, 0.0, -0.13))


def build_shotgun(mats):
    """Wood + blued steel pump — matches shotgun_ref."""
    dark, steel, body, glass, glow, skin = mats
    wood = make_mat("wood", (0.4, 0.24, 0.12), 0.04, 0.78)
    blue = make_mat("blue_steel", (0.18, 0.2, 0.24), 0.85, 0.28)
    box(0.046, 0.14, 0.055, (0, -0.15, -0.018), mat=wood, name="stock", bevel_w=0.008)
    box(0.042, 0.05, 0.06, (0, -0.2, -0.005), mat=wood, name="butt", bevel_w=0.006)
    box(0.048, 0.16, 0.052, (0, 0.02, -0.014), mat=blue, name="receiver", bevel_w=0.005)
    # Pump forend (ribbed)
    box(0.042, 0.1, 0.042, (0, 0.18, -0.016), mat=wood, name="Mag", bevel_w=0.006)
    for i, oy in enumerate((-0.025, -0.01, 0.005, 0.02, 0.035)):
        box(0.044, 0.01, 0.044, (0, 0.16 + oy, -0.016), mat=wood, name=f"rib{i}", do_bevel=False)
    cyl(0.012, 0.32, (0, 0.38, 0.002), RX90, 16, blue, "barrel")
    cyl(0.009, 0.26, (0, 0.34, -0.026), RX90, 12, steel, "tube")
    cyl(0.013, 0.02, (0, 0.28, -0.01), RX90, 10, steel, "band")
    cyl(0.0035, 0.01, (0, 0.44, 0.026), (0, 0, 0), 8, glow, "bead")
    box(0.034, 0.038, 0.085, (0, -0.02, -0.09), rot=(math.radians(10), 0, 0),
        mat=dark, name="grip", bevel_w=0.005)
    _hands(skin, (0.014, -0.02, -0.1), (0.0, 0.18, -0.05))
    empty("Sight", (0, 0.42, 0.026))
    empty("Muzzle", (0, 0.55, 0.002))
    empty("Mag", (0, 0.18, -0.016))


def build_pistol(mats):
    """Modern striker pistol — matches pistol_ref."""
    dark, steel, body, glass, glow, skin = mats
    # Slide
    box(0.03, 0.16, 0.034, (0, 0.05, 0.002), mat=steel, name="slide", bevel_w=0.003)
    for i, oy in enumerate((0.09, 0.105, 0.12, 0.135)):
        box(0.032, 0.005, 0.018, (0, oy, 0.01), mat=dark, name=f"serr{i}", do_bevel=False)
    # Frame
    box(0.028, 0.12, 0.028, (0, 0.03, -0.02), mat=dark, name="frame", bevel_w=0.003)
    # Grip
    box(0.032, 0.04, 0.1, (0, -0.04, -0.085), rot=(math.radians(12), 0, 0),
        mat=dark, name="grip", bevel_w=0.006)
    # Grip texture ridges
    for i, oy in enumerate((-0.05, -0.07, -0.09, -0.11)):
        box(0.034, 0.008, 0.02, (0, -0.04, oy), mat=body, name=f"grip_r{i}", do_bevel=False)
    cyl(0.0065, 0.05, (0, 0.15, 0.0), RX90, 12, steel, "barrel")
    box(0.026, 0.034, 0.085, (0, -0.03, -0.09), mat=body, name="Mag", bevel_w=0.002)
    # Irons
    box(0.003, 0.003, 0.01, (0, 0.11, 0.022), mat=glow, name="front_sight", do_bevel=False)
    box(0.012, 0.004, 0.008, (0, -0.01, 0.02), mat=dark, name="rear_sight", bevel_w=0.001)
    box(0.008, 0.038, 0.032, (0, 0.025, -0.05), mat=dark, name="trig_guard", bevel_w=0.003)
    box(0.006, 0.018, 0.02, (0, 0.02, -0.06), mat=steel, name="trigger", bevel_w=0.002)
    # Accessory rail under frame
    box(0.02, 0.05, 0.008, (0, 0.06, -0.03), mat=dark, name="rail", bevel_w=0.001)
    _hands(skin, (0.01, -0.04, -0.1))
    empty("Sight", (0, 0.05, 0.022))
    empty("Muzzle", (0, 0.18, 0.0))
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

# Class body colors sampled from Imagine refs (approx)
BASE_COLORS = {
    "ar": (0.12, 0.13, 0.14),       # black / dark grey polymer
    "smg": (0.55, 0.48, 0.36),      # FDE / tan
    "lmg": (0.22, 0.28, 0.18),      # OD green
    "sniper": (0.2, 0.24, 0.18),    # OD stock
    "dmr": (0.28, 0.32, 0.2),       # olive
    "shotgun": (0.35, 0.22, 0.12),  # wood
    "pistol": (0.1, 0.1, 0.11),     # black frame
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
    # Nearly invisible glass — never a solid blue tube on the optic
    glass = make_mat("glass", (0.55, 0.7, 0.8), 0.05, 0.08, None, emit=0.05, alpha=0.12)
    glow = make_mat("glow", (1.0, 0.12, 0.1), 0.05, 0.25, None, emit=1.6)
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
