# Qvist 2026 concept — active model

The user approved Qvist_designs' generic 2026 concept as the free alternative and supplied its complete official GLB. The 40,461,936-byte original is retained in `dist/models/f1_2026_concept_polygon_model.glb`.

Source: https://sketchfab.com/3d-models/f1-2026-concept-polygon-model-ea3bde709b1e4dc9b0ec8557d106ed42

License: CC BY 4.0. Attribution and changes appear in the About dialog, `dist/models/ATTRIBUTION.md`, and the adapted GLB metadata.

Original SHA-256: `004c7a1c8d7be153f85c5565a38aeec57db8feaa220aabcc6b7b0bbea6b49d02`.

## Preparation

The original GLB has 11 export chunks, not 11 manufacturing parts. Offline inspection in Blender found separate wheel shells, exhaust and mirrors, with most bodywork fused. `scripts/build-qvist.mjs` identifies connected geometry using position keys for connectivity only; it retains the actual source coordinates and normals.

For fused bodywork, half-space clipping subdivides crossing triangles to create clean illustrative seams. Every surface region is assigned exactly once. This is an educational cutaway with open cut surfaces, not a mechanically accurate disassembly or reconstruction of missing internal hardware. The assembled silhouette is unchanged within float precision.

The script exports `dist/models/qvist-2026-assemblies.glb`, with 16 named nodes, red/graphite materials, embedded license metadata and no external texture or decoder dependencies. It removes constant vertex colors and deduplicates identical position/normal pairs. The roughly 26 MB output retains the source's 1.16 million-triangle surface; cut subdivisions add triangles, without decimation. The unchanged original remains available separately but is not loaded by the explorer.

Rebuild: `node scripts/build-qvist.mjs`. The source file must remain present. The numeric preparation report is saved under ignored `artifacts/qvist/assembly-report.json`. Offline audit and reference render scripts are `scripts/prepare-qvist.py` and `scripts/render-qvist.py` (Blender 5.2).

## Runtime and checks

`dist/models/asset.json` maps all 16 nodes to descriptions and separation vectors. Every mesh must have exactly one owner. Display normalization sets the full car length to 5.2 units and rests its tyres at the studio ground. The floor stays stationary while surrounding groups separate. All changes to assembly position are absolute, so repeated explode/reassemble cycles cannot accumulate drift.

`npm run check` validates modules, references and configuration, plus synthetic importer tests and the real supplied model. Real-model tests compare original/adapted surface area and bounds, verify all groups can be raycast-selected, and confirm exact matrix restoration after 30 disassembly cycles.

Offline assembled and exploded model renders were inspected. No website browser UI testing or performance benchmark was requested or performed. High-detail geometry may load or render more slowly on older devices. Shadow maps update only when geometry moves.

This is Qvist's independent concept, not a verified Ferrari SF-26 or an assertion of complete final-2026 regulation compliance. No publication was performed.
