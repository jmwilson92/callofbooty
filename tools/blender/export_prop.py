"""
Blender headless prop exporter for Call of Booty.

Usage:
  blender --background --python tools/blender/export_prop.py -- \
      --name crate --ref assets/refs/crate_ref.jpg --out assets/models/crate.glb

Builds a simple low-poly prop, applies the Imagine reference as albedo
(via emission/base color image), and exports GLB (Y-up, meters).

If you refine the mesh by hand in Blender UI, re-export with File > Export > glTF 2.0.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

try:
    import bpy
    from mathutils import Vector
except ImportError:
    print("Run this script inside Blender: blender --background --python export_prop.py -- ...")
    sys.exit(1)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    for block in bpy.data.images:
        bpy.data.images.remove(block)


def make_material(name: str, color=(0.6, 0.6, 0.6, 1.0), image_path: str | None = None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.75
    if image_path and Path(image_path).is_file():
        img = bpy.data.images.load(str(Path(image_path).resolve()))
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = img
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def build_crate(mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
    obj = bpy.context.active_object
    obj.scale = (1.1, 0.9, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    # Corner straps
    for sx, sy in ((-0.52, -0.42), (0.52, -0.42), (-0.52, 0.42), (0.52, 0.42)):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, sy, 0.5))
        strap = bpy.context.active_object
        strap.scale = (0.08, 0.08, 1.02)
        bpy.ops.object.transform_apply(scale=True)
        strap.data.materials.append(mat)
    return obj


def build_barrel(mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.35, depth=1.0, location=(0, 0, 0.5))
    obj = bpy.context.active_object
    obj.data.materials.append(mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.37, depth=0.06, location=(0, 0, 0.12))
    bpy.context.active_object.data.materials.append(mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.37, depth=0.06, location=(0, 0, 0.88))
    bpy.context.active_object.data.materials.append(mat)
    return obj


def build_cone(mat):
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.22, radius2=0.04, depth=0.7, location=(0, 0, 0.35))
    obj = bpy.context.active_object
    obj.data.materials.append(mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.28, depth=0.05, location=(0, 0, 0.025))
    bpy.context.active_object.data.materials.append(mat)
    return obj


def build_dumpster(mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.55))
    obj = bpy.context.active_object
    obj.scale = (1.4, 0.8, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.2))
    lid = bpy.context.active_object
    lid.scale = (1.42, 0.82, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    lid.rotation_euler[0] = math.radians(-12)
    lid.data.materials.append(mat)
    return obj


def build_hydrant(mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.18, depth=0.55, location=(0, 0, 0.35))
    body = bpy.context.active_object
    body.data.materials.append(mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.12, depth=0.25, location=(0, 0, 0.72))
    bpy.context.active_object.data.materials.append(mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.08, depth=0.35, location=(0.22, 0, 0.5))
    bpy.context.active_object.rotation_euler[1] = math.radians(90)
    bpy.context.active_object.data.materials.append(mat)
    return body


def build_bollard(mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.16, depth=0.9, location=(0, 0, 0.45))
    obj = bpy.context.active_object
    obj.data.materials.append(mat)
    return obj


def build_newsbox(mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.55))
    obj = bpy.context.active_object
    obj.scale = (0.55, 0.4, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    return obj


def build_palm(mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.18, depth=2.4, location=(0, 0, 1.2))
    trunk = bpy.context.active_object
    trunk.data.materials.append(mat)
    for i in range(6):
        ang = i * (math.pi * 2 / 6)
        bpy.ops.mesh.primitive_cone_add(
            vertices=5, radius1=0.55, radius2=0.05, depth=1.4,
            location=(math.cos(ang) * 0.35, math.sin(ang) * 0.35, 2.5),
        )
        frond = bpy.context.active_object
        frond.rotation_euler[0] = math.radians(55)
        frond.rotation_euler[2] = ang
        frond.data.materials.append(mat)
    return trunk


BUILDERS = {
    "crate": (build_crate, (0.55, 0.4, 0.25, 1.0)),
    "barrel": (build_barrel, (0.15, 0.35, 0.7, 1.0)),
    "traffic_cone": (build_cone, (0.95, 0.4, 0.08, 1.0)),
    "dumpster": (build_dumpster, (0.2, 0.45, 0.25, 1.0)),
    "fire_hydrant": (build_hydrant, (0.85, 0.12, 0.1, 1.0)),
    "bollard": (build_bollard, (0.65, 0.65, 0.62, 1.0)),
    "newsbox": (build_newsbox, (0.12, 0.2, 0.45, 1.0)),
    "palm_tree": (build_palm, (0.25, 0.45, 0.18, 1.0)),
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


def main():
    args = parse_args(sys.argv)
    clear_scene()
    builder, color = BUILDERS[args.name]
    mat = make_material(args.name + "_mat", color, args.ref)
    builder(mat)

    # Join all mesh objects
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
    )
    print(f"Exported {out}")


if __name__ == "__main__":
    main()
