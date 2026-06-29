"""Blender headless: import GLTF, render Freestyle wireframe + SVG."""
import bpy
import os
import sys
from math import radians

glb_path = '/Volumes/MacMini M4/OpenClaw/workspace/aecprism-site/assets/building.glb'
out_dir = os.path.dirname(glb_path)
png_path = os.path.join(out_dir, 'building_wireframe.png')

# ── Clear scene ──
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Remove default cube, light, camera from startup
for o in bpy.data.objects:
    bpy.data.objects.remove(o, do_unlink=True)

# ── Import GLB ──
bpy.ops.import_scene.gltf(filepath=glb_path)
print(f"Imported GLB, objects: {len(bpy.data.objects)}")

# ── Join all meshes ──
bpy.ops.object.select_all(action='SELECT')
meshes = [o for o in bpy.context.selected_objects if o.type == 'MESH']
if meshes:
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    print(f"Joined {len(meshes)} meshes into: {obj.name}")
else:
    print("ERROR: No mesh found")
    sys.exit(1)

# ── Normalize scale ──
# Get bounding box and scale to fit
bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
width = max(xs) - min(xs)
depth = max(ys) - min(ys)
height = max(zs) - min(zs)
max_dim = max(width, depth, height)
target_size = 30
scale_factor = target_size / max_dim

obj.scale = (scale_factor, scale_factor, scale_factor)
bpy.ops.object.transform_apply(scale=True)
print(f"Scaled model: {width:.1f}x{depth:.1f}x{height:.1f} → x{scale_factor:.3f}")

# ── Set material: white emission for wireframe visibility ──
mat = bpy.data.materials.new(name="WireframeMat")
mat.use_nodes = False
mat.diffuse_color = (1, 1, 1, 1)
obj.data.materials.clear()
obj.data.materials.append(mat)

# ── Camera: semi-side elevated view ──
bpy.ops.object.camera_add()
cam = bpy.context.active_object
cam.location = (18, -30, 15)
# Look at origin
direction = -cam.location.normalized()
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 35
bpy.context.scene.camera = cam

# ── Lighting ──
bpy.ops.object.light_add(type='SUN', location=(5, -10, 25))
bpy.context.active_object.data.energy = 2

# ── Background: dark ──
world = bpy.data.worlds.new(name="DarkWorld")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.02, 0.02, 0.05, 1)

# ── Render settings ──
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 2000
scene.render.resolution_y = 1500
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.filepath = png_path

# ── Freestyle wireframe ──
scene.render.use_freestyle = True
scene.render.line_thickness_mode = 'ABSOLUTE'
scene.render.line_thickness = 2.0

view_layer = bpy.context.view_layer
view_layer.freestyle_settings.crease_angle = 134
lineset = view_layer.freestyle_settings.linesets['LineSet']
lineset.select_edge_mark = False
lineset.select_contour = True
lineset.select_border = True
lineset.select_crease = True
lineset.select_silhouette = True
lineset.select_suggestive_contour = False
lineset.select_material_boundary = False
lineset.linestyle.thickness = 2.0
lineset.linestyle.color = (0.55, 0.65, 1.0)

# ── Render ──
bpy.ops.render.render(write_still=True)
print(f"PNG exported: {png_path}")
print("Done.")
