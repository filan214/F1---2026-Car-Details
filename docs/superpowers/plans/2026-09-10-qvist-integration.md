# Qvist concept integration plan

**Goal:** Activate the approved CC BY 4.0 model with selectable, reversible exploded assemblies.

**Architecture:** Preserve the downloaded GLB as source data. Use Blender offline to reconstruct connected shells across export chunks, inspect them, and export named assemblies. The existing Three.js importer consumes the resulting GLB and the explicit component manifest.

**Scope:** Qvist's generic concept, not Ferrari CAD. Use only source geometry. Keep the current interface and local preview; publishing remains unauthorized. No browser UI testing has been requested.

- [x] Inspect the complete source, separate connected geometry, and render an offline parts reference. Files: `scripts/prepare-qvist.py`, `artifacts/qvist/`.
- [x] Group identifiable parts, preserve the surface and silhouette, remove redundant vertex colors, and export an efficient GLB. Record the source hash, triangle count and changes. Clean clipping adds subdivisions to fused surfaces; it does not delete source surface area.
- [x] Activate `dist/models/asset.json` with named component selectors, descriptions and separation vectors; retain creator credit and license notice.
- [x] Verify the actual GLB with the runtime loader, full mesh coverage, raycast selection and exact reassembly. Ten tests pass, with a successful full-file HTTP check and correct progress headers.
- [x] Update acquisition documentation and serve the local preview on port 5173.
