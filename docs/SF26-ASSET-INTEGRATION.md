# Ferrari SF-26 asset integration

**Current status:** The user approved Qvist's generic 2026 concept, supplied the complete GLB, and it is now active as 16 illustrative display groups. See [Qvist integration details](QVIST-MODEL.md). The acquisition history below is retained as context; sign-in and download are complete.

## Selected model: Qvist's 2026 concept

The user explicitly approved using [Qvist_designs' F1 2026 concept](https://sketchfab.com/3d-models/f1-2026-concept-polygon-model-ea3bde709b1e4dc9b0ec8557d106ed42) as the open alternative. The CC BY 4.0 license allows adaptation and redistribution with attribution, a license link and identification of changes. This is a generic 2026 concept, not Ferrari's SF-26. The authenticated download panel confirmed free STL, USDZ, glTF and GLB formats. After an interrupted browser transfer, the user supplied the complete 40,461,936-byte GLB directly in the models folder.

The GLB contains creator, source and CC-BY-4.0 provenance. Its 11 anonymous mesh nodes are export chunks, not verified mechanical components. Offline inspection identified separate wheels, exhaust and mirrors, with fused bodywork. The adaptation retains the original surface and adds clean display seams to create 16 recognizable groups. It uses red/graphite finishes and no external textures. See `scripts/build-qvist.mjs` for the repeatable preparation.

The approved model, descriptions and license metadata are active in `dist/models/asset.json`. The About dialog displays source/creator/license credit and a changes notice. The Qvist replacement has passed actual geometry, raycast coverage and exact reassembly checks in addition to the existing importer tests. APX-01 remains available only as a deliberately configured fallback.

See [free resource audit](references/free-f1-models.md) for the open alternatives. Excalibur's restricted GP4 asset and its unsent contact request are no longer active routes. Do not contact creators or purchase a model. No open-licensed asset satisfying the exact SF-26 and complete-component requirements has been verified.

## Previous paid candidate

[Ferrari SF26 Formula 1 Car 2026 by 3dreamracer](https://www.cgtrader.com/3d-models/car/racing-car/ferrari-sf26-formula-1-car-2026) was listed at **USD 99** on 10 September 2026. The creator explicitly lists 55 separate parts, PBR materials, 4K textures and BLEND/FBX/OBJ formats. This is a third-party artist model under an **Editorial License (no AI)**, not Ferrari-certified assembly CAD. The listing does not establish a complete internal powertrain or exact race specification.

No purchase has been made and no paid source asset has been downloaded. The CGTrader terms restrict redistribution of source products and require safeguarding models in software. Do not assume an openly downloadable GLB is permitted. This paid candidate is no longer the active acquisition route.

Terms: https://www.cgtrader.com/pages/terms-and-conditions

## Implemented

- `dist/load-car.js` loads configured GLB, glTF or FBX assets, keeping the original procedural concept clearly identified until a licensed asset is present.
- `dist/imported-car.js` preserves the authored geometry, materials, textures and nested transforms. Display normalization does not assert physical dimensions.
- The component list and count are derived from the imported model's verified mapping. The model is not forced into the old ten-group concept hierarchy.
- Every mesh must belong to exactly one mapped assembly. Missing, ambiguous and overlapping mappings fail with explicit errors, instead of moving or identifying the wrong part.
- Selection restores authored emissive properties and isolates material instances between parts. Explosion is absolute and reversible, with no cumulative position drift.
- The installed Three.js GLTF/FBX loaders and their local dependencies are vendored. GLB/glTF exports should use standard uncompressed mesh data; Draco and KTX2 decoders are not configured.
- The local server sends appropriate model, JSON and texture content types.

Seven automated tests and the module/interface checks passed after implementation. A separate creator-permitted embed capability probe did not establish a working component API in the local browser, so the website does not depend on that unverified route.

## After website reuse rights are established

1. Retain the license or written permission privately. Keep original archives outside the published `dist/` tree.
2. Download an open-licensed asset through its official download route and inspect the actual source hierarchy, texture paths, dimensions and part coverage. Preserve separate objects and names when exporting to GLB/FBX; retain the creator's attribution and accurately identify the model.
3. Put the working model and needed textures under `dist/models/` for local evaluation. Set `dist/models/asset.json` with the relative `asset` path, `name`, `subtitle`, optional `rotation` in radians, and `license: { acquired: true, source: <product URL>, usage: <verified permitted use> }`.
4. Populate `components` from the actual inspected nodes. Each entry requires `id`, `name`, and `nodes` containing exact source object names or full hierarchy paths. Optional fields are `description`, `category`, `material`, `icon`, `offset` in display coordinates, and `revealOnSelect`.
5. Map compound objects at their common ancestor so material primitives stay together. Never map both a parent and one of its descendants. All rendered meshes need a mapping.
6. Run `npm run check`, then verify the acquired model's textures, camera framing, selection, exploded layout and reassembly. Do not claim hidden components exist unless the source contains them.
7. Resolve the acquired license's web-distribution conditions and the separate outstanding publishing authorization before any hosted upload.

## Current completion

Qvist is active locally, with 16 groups and preserved source surface geometry. Its offline assembled and exploded model renders were inspected. Website browser QA and publishing have not been performed. Do not silently relabel this concept or its illustrative seams as Ferrari manufacturing CAD.
