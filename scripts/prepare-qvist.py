"""Inspect the approved Qvist GLB offline; never execute code from the asset."""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'qvist'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'dist' / 'models' / 'f1_2026_concept_polygon_model.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
car = bpy.context.object
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
original_faces = len(car.data.polygons)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
# Rejoin only coincident CAD vertices split by the glTF 16-bit index limit.
bpy.ops.mesh.remove_doubles(threshold=0.001)
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')
parts = sorted([o for o in bpy.context.scene.objects if o.type == 'MESH'], key=lambda o: len(o.data.polygons), reverse=True)
report = []
for i, obj in enumerate(parts):
    obj.name = f'shell_{i:03d}'
    coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
    minimum = [min(v[axis] for v in coords) for axis in range(3)]
    maximum = [max(v[axis] for v in coords) for axis in range(3)]
    report.append(dict(name=obj.name, vertices=len(obj.data.vertices), faces=len(obj.data.polygons), min=minimum, max=maximum))
(OUT / 'shells.json').write_text(json.dumps(dict(original_faces=original_faces, parts=report), indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'separated.blend'))
print('QVIST_AUDIT ' + json.dumps(dict(original_faces=original_faces, shells=len(parts), total_faces=sum(p['faces'] for p in report))))
