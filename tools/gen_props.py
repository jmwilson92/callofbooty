#!/usr/bin/env python3
"""
Generate low-poly prop GLBs without Blender (immediate playable placeholders).

Uses the Imagine refs in assets/refs/ as catalog entries and writes simple
box/cylinder-ish meshes to assets/models/*.glb via pygltflib.

When Blender is available, re-export nicer meshes with:
  tools/build_props.sh  (calls blender/export_prop.py)
"""
from __future__ import annotations

import json
import math
import struct
from pathlib import Path

try:
    from pygltflib import (
        GLTF2, Scene, Node, Mesh, Primitive, Attributes, Buffer, BufferView,
        Accessor, Asset, Material, PbrMetallicRoughness,
        ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, FLOAT, UNSIGNED_SHORT,
    )
except ImportError:
    raise SystemExit("pip install pygltflib")

ROOT = Path(__file__).resolve().parents[1]
# Served by Vite from public/
OUT = ROOT / "public" / "assets" / "models"
REFS = ROOT / "public" / "assets" / "refs"
CATALOG = ROOT / "public" / "assets" / "catalog.json"


def pack_mesh(positions, indices, color):
    """positions: list of (x,y,z), indices triangles, color rgba 0-1."""
    pos_bytes = b"".join(struct.pack("<fff", *p) for p in positions)
    # pad to 4
    while len(pos_bytes) % 4:
        pos_bytes += b"\x00"
    idx_bytes = b"".join(struct.pack("<H", i) for i in indices)
    while len(idx_bytes) % 4:
        idx_bytes += b"\x00"
    blob = pos_bytes + idx_bytes

    xs = [p[0] for p in positions]
    ys = [p[1] for p in positions]
    zs = [p[2] for p in positions]

    gltf = GLTF2(
        asset=Asset(version="2.0", generator="callofbooty-gen_props"),
        scenes=[Scene(nodes=[0])],
        scene=0,
        nodes=[Node(mesh=0)],
        meshes=[Mesh(primitives=[Primitive(
            attributes=Attributes(POSITION=0),
            indices=1,
            material=0,
        )])],
        materials=[Material(
            pbrMetallicRoughness=PbrMetallicRoughness(
                baseColorFactor=list(color),
                metallicFactor=0.05,
                roughnessFactor=0.85,
            ),
            doubleSided=True,
        )],
        accessors=[
            Accessor(
                bufferView=0, componentType=FLOAT, count=len(positions), type="VEC3",
                max=[max(xs), max(ys), max(zs)],
                min=[min(xs), min(ys), min(zs)],
            ),
            Accessor(
                bufferView=1, componentType=UNSIGNED_SHORT, count=len(indices), type="SCALAR",
            ),
        ],
        bufferViews=[
            BufferView(buffer=0, byteOffset=0, byteLength=len(pos_bytes), target=ARRAY_BUFFER),
            BufferView(buffer=0, byteOffset=len(pos_bytes), byteLength=len(idx_bytes), target=ELEMENT_ARRAY_BUFFER),
        ],
        buffers=[Buffer(byteLength=len(blob))],
    )
    gltf.set_binary_blob(blob)
    return gltf


def box(cx, cy, cz, sx, sy, sz):
    """Axis-aligned box centered, size full extents. Y-up."""
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    # 8 corners
    c = [
        (cx - hx, cy - hy, cz - hz),
        (cx + hx, cy - hy, cz - hz),
        (cx + hx, cy + hy, cz - hz),
        (cx - hx, cy + hy, cz - hz),
        (cx - hx, cy - hy, cz + hz),
        (cx + hx, cy - hy, cz + hz),
        (cx + hx, cy + hy, cz + hz),
        (cx - hx, cy + hy, cz + hz),
    ]
    # faces as two tris each
    faces = [
        (0, 1, 2, 3),  # -Z
        (5, 4, 7, 6),  # +Z
        (4, 0, 3, 7),  # -X
        (1, 5, 6, 2),  # +X
        (3, 2, 6, 7),  # +Y
        (4, 5, 1, 0),  # -Y
    ]
    positions = []
    indices = []
    for a, b, c_, d in faces:
        base = len(positions)
        positions.extend([c[a], c[b], c[c_], c[d]])
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return positions, indices


def merge(parts):
    positions = []
    indices = []
    for pos, idx in parts:
        base = len(positions)
        positions.extend(pos)
        indices.extend(i + base for i in idx)
    return positions, indices


def cylinder(cx, cy, cz, r, h, segs=10):
    positions = []
    indices = []
    # bottom + top center
    bottom = len(positions)
    positions.append((cx, cy, cz))
    top = len(positions)
    positions.append((cx, cy + h, cz))
    ring0 = len(positions)
    for i in range(segs):
        a = (i / segs) * math.tau
        positions.append((cx + math.cos(a) * r, cy, cz + math.sin(a) * r))
    ring1 = len(positions)
    for i in range(segs):
        a = (i / segs) * math.tau
        positions.append((cx + math.cos(a) * r, cy + h, cz + math.sin(a) * r))
    for i in range(segs):
        j = (i + 1) % segs
        # bottom
        indices.extend([bottom, ring0 + j, ring0 + i])
        # top
        indices.extend([top, ring1 + i, ring1 + j])
        # side
        indices.extend([ring0 + i, ring0 + j, ring1 + j, ring0 + i, ring1 + j, ring1 + i])
    return positions, indices


PROPS = {
    "crate": {
        "ref": "crate_ref.jpg",
        "color": (0.55, 0.4, 0.22, 1.0),
        "collision": [1.1, 1.0, 0.9],
        "build": lambda: merge([
            box(0, 0.5, 0, 1.1, 1.0, 0.9),
            box(-0.52, 0.5, -0.42, 0.1, 1.0, 0.1),
            box(0.52, 0.5, -0.42, 0.1, 1.0, 0.1),
            box(-0.52, 0.5, 0.42, 0.1, 1.0, 0.1),
            box(0.52, 0.5, 0.42, 0.1, 1.0, 0.1),
        ]),
    },
    "barrel": {
        "ref": "barrel_ref.jpg",
        "color": (0.15, 0.35, 0.75, 1.0),
        "collision": [0.7, 1.0, 0.7],
        "build": lambda: merge([
            cylinder(0, 0, 0, 0.35, 1.0, 12),
            cylinder(0, 0.08, 0, 0.37, 0.06, 12),
            cylinder(0, 0.86, 0, 0.37, 0.06, 12),
        ]),
    },
    "traffic_cone": {
        "ref": "traffic_cone_ref.jpg",
        "color": (0.95, 0.4, 0.08, 1.0),
        "collision": [0.45, 0.7, 0.45],
        "build": lambda: merge([
            box(0, 0.025, 0, 0.5, 0.05, 0.5),
            # stepped cone approximation
            box(0, 0.15, 0, 0.36, 0.2, 0.36),
            box(0, 0.35, 0, 0.24, 0.2, 0.24),
            box(0, 0.55, 0, 0.12, 0.2, 0.12),
        ]),
    },
    "dumpster": {
        "ref": "dumpster_ref.jpg",
        "color": (0.18, 0.42, 0.22, 1.0),
        "collision": [1.4, 1.2, 0.85],
        "build": lambda: merge([
            box(0, 0.55, 0, 1.4, 1.1, 0.8),
            box(0, 1.18, 0.05, 1.42, 0.1, 0.82),
        ]),
    },
    "fire_hydrant": {
        "ref": "fire_hydrant_ref.jpg",
        "color": (0.85, 0.12, 0.1, 1.0),
        "collision": [0.45, 0.85, 0.45],
        "build": lambda: merge([
            cylinder(0, 0.05, 0, 0.18, 0.55, 10),
            cylinder(0, 0.6, 0, 0.12, 0.25, 10),
            box(0.22, 0.45, 0, 0.28, 0.12, 0.12),
            box(-0.22, 0.45, 0, 0.28, 0.12, 0.12),
        ]),
    },
    "bollard": {
        "ref": "bollard_ref.jpg",
        "color": (0.62, 0.62, 0.58, 1.0),
        "collision": [0.35, 0.9, 0.35],
        "build": lambda: cylinder(0, 0, 0, 0.16, 0.9, 10),
    },
    "newsbox": {
        "ref": "newsbox_ref.jpg",
        "color": (0.12, 0.18, 0.42, 1.0),
        "collision": [0.55, 1.1, 0.4],
        "build": lambda: box(0, 0.55, 0, 0.55, 1.1, 0.4),
    },
    "palm_tree": {
        "ref": "palm_tree_ref.jpg",
        "color": (0.28, 0.42, 0.18, 1.0),
        "collision": [0.5, 2.6, 0.5],
        "build": lambda: merge([
            cylinder(0, 0, 0, 0.16, 2.2, 8),
            box(0, 2.5, 0, 1.6, 0.35, 1.6),
            box(0.5, 2.35, 0.3, 1.0, 0.15, 0.4),
            box(-0.5, 2.35, -0.3, 1.0, 0.15, 0.4),
            box(0.3, 2.35, -0.5, 0.4, 0.15, 1.0),
            box(-0.3, 2.35, 0.5, 0.4, 0.15, 1.0),
        ]),
    },
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = {"version": 1, "props": {}}
    for name, spec in PROPS.items():
        pos, idx = spec["build"]()
        # pygltflib index count must match — clamp indices to valid
        gltf = pack_mesh(pos, idx, spec["color"])
        path = OUT / f"{name}.glb"
        gltf.save(str(path))
        ref = REFS / spec["ref"]
        catalog["props"][name] = {
            "glb": f"assets/models/{name}.glb",  # URL path under public/
            "ref": f"assets/refs/{spec['ref']}" if ref.exists() else None,
            "collision": spec["collision"],
            "source": "gen_props.py (replace with Blender export when refined)",
        }
        print(f"wrote {path} ({path.stat().st_size} bytes)")
    CATALOG.write_text(json.dumps(catalog, indent=2) + "\n")
    print(f"catalog -> {CATALOG}")


if __name__ == "__main__":
    main()
