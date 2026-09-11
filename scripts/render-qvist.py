"""Offline reference renders for inspecting the source model, not website UI QA."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'qvist'
prepared = '--prepared' in sys.argv
if prepared:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'dist/models/qvist-2026-assemblies.glb'))
else:
    bpy.ops.wm.open_mainfile(filepath=str(OUT / 'separated.blend'))
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.studiolight_rotate_z = 0.5
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = 'BOTH'
scene.display.shading.background_type = 'WORLD'
scene.world = bpy.data.worlds.new('Reference background')
scene.world.color = (0.09,0.10,0.12)
scene.render.resolution_x = 1600
scene.render.resolution_y = 750
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
for o in scene.objects:
    if o.type == 'MESH':
        o.color = (0.6,0.6,0.6,1)
bpy.ops.object.camera_add()
camera = bpy.context.object
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 6400
camera.data.clip_end = 30000
target = Vector((1400,0,400))
for name, position in [('top',(1400,0,10000)),('side',(1400,-10000,450)),('perspective',(-5800,-7500,5800))]:
    camera.location = position
    camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(OUT / (('prepared-' if prepared else '') + name + '.png'))
    bpy.ops.render.render(write_still=True)
if prepared:
    report=json.loads((OUT / 'assembly-report.json').read_text())
    for part in report['assemblies']:
        obj=bpy.data.objects[part['id']]
        x,y,z=part['offset']
        obj.location += Vector((x,-z,y))*1037
    camera.data.ortho_scale=8800
    target=Vector((1400,0,950))
    camera.location=(-5800,-7500,5800)
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT / 'prepared-exploded.png')
    bpy.ops.render.render(write_still=True)
