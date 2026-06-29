"""Render wireframe SVG from GLB using trimesh + matplotlib LineCollection."""
import trimesh
import numpy as np
import os
import sys
import math

glb_path = '/Volumes/MacMini M4/OpenClaw/workspace/aecprism-site/assets/building.glb'
out_dir = os.path.dirname(glb_path)
svg_path = os.path.join(out_dir, 'building_wireframe_clean.svg')
png_path = os.path.join(out_dir, 'building_wireframe_clean.png')

print("Loading GLB...")
scene = trimesh.load(glb_path)
print(f"Geometries: {len(scene.geometry)}")

# Merge all
print("Merging...")
all_meshes = []
for name, geom in scene.geometry.items():
    if hasattr(geom, 'vertices') and len(geom.vertices) > 0:
        mesh = geom.copy()
        if name in scene.graph:
            try:
                t = scene.graph[name][0]
                mesh.apply_transform(t)
            except:
                pass
        all_meshes.append(mesh)

merged = trimesh.util.concatenate(all_meshes)
print(f"Merged: {len(merged.vertices)}v, {len(merged.faces)}f")

# Sample faces
MAX_FACES = 25000
if len(merged.faces) > MAX_FACES:
    print(f"Sampling {MAX_FACES} faces...")
    idx = np.random.choice(len(merged.faces), MAX_FACES, replace=False)
    merged.update_faces(idx)
    merged.remove_unreferenced_vertices()
    print(f"→ {len(merged.vertices)}v, {len(merged.faces)}f")

# Center and normalize
merged.vertices -= merged.centroid
scale = 1.0 / max(merged.extents)
merged.vertices *= scale

# Camera rotation (semi-side elevated)
ah = math.radians(-35)   # horizontal
av = math.radians(25)    # vertical look-down

verts = merged.vertices.copy()
# Rotate around Y (horizontal)
x = verts[:, 0] * math.cos(ah) + verts[:, 2] * math.sin(ah)
z = -verts[:, 0] * math.sin(ah) + verts[:, 2] * math.cos(ah)
# Rotate around X (vertical)
y = verts[:, 1] * math.cos(av) - z * math.sin(av)
z2 = verts[:, 1] * math.sin(av) + z * math.cos(av)

pts = np.column_stack([x, y])
depths = z2

# Sort faces by depth for proper occlusion-like wireframe
face_centers_z = np.mean(depths[merged.faces], axis=1)
face_order = np.argsort(-face_centers_z)  # back to front

# Build edge list (unique edges from faces)
print("Building edges...")
edges_set = set()
for face in merged.faces:
    for i in range(3):
        a, b = face[i], face[(i+1)%3]
        if a < b:
            edges_set.add((a, b))
        else:
            edges_set.add((b, a))
edges = np.array(list(edges_set))
print(f"Edges: {len(edges)}")

# Create line segments
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

CANVAS = 2000
MARGIN = 80

pts_draw = pts.copy()
pts_draw -= pts_draw.min(axis=0)
pts_draw /= pts_draw.max(axis=0)
pts_draw = pts_draw * (CANVAS - 2 * MARGIN) + MARGIN
pts_draw[:, 1] = CANVAS - pts_draw[:, 1]

# Build segments
segments = []
alphas = []
for idx in range(len(edges)):
    edge = edges[idx]
    seg = pts_draw[edge]
    z_avg = (depths[edge[0]] + depths[edge[1]]) / 2
    segments.append(seg)
    # Closer edges = brighter
    z_norm = (z_avg - depths.min()) / (depths.max() - depths.min() + 0.001)
    alphas.append(0.15 + z_norm * 0.4)

fig, ax = plt.subplots(figsize=(16, 12), facecolor='#050508')
ax.set_facecolor('#050508')

lc = LineCollection(segments, colors='#4466aa', linewidths=0.6, alpha=0.55)
ax.add_collection(lc)

ax.set_xlim(0, CANVAS)
ax.set_ylim(0, CANVAS * 0.75)
ax.set_aspect('equal')
ax.axis('off')

plt.tight_layout(pad=0)
plt.savefig(png_path, dpi=100, facecolor='#050508', bbox_inches='tight', pad_inches=0)
plt.savefig(svg_path, facecolor='#050508', bbox_inches='tight', pad_inches=0)

print(f"PNG: {os.path.getsize(png_path)/1024:.0f} KB")
print(f"SVG: {os.path.getsize(svg_path)/1024:.0f} KB")
print("Done.")
