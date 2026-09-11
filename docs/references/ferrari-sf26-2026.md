# Ferrari SF-26 reference and model audit

Target selected by the user: Ferrari's 2026 Formula One car. Reference specification: the 23 January 2026 launch car, unless a different race specification is requested. Researched 10 September 2026.

## Current implementation

The current procedural APX-01 is a stylized concept, not an SF-26 replica. Its geometry must not be relabelled as identical to Ferrari's car. The model has ten assembly groups, a 3.26-unit axle spacing, a 5.203 × 1.256 × 2.487-unit overall bounding box, approximately 0.896-unit tyres, a four-profile front wing, a lower rear beam wing, and simplified generic internals. No conversion from these original arbitrary units to millimetres was established.

## Reference photographs

Official Formula One gallery, featuring Ferrari launch renders:

https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS.7HdOPtJJwN5VHJ8XAWVtuS

Locally inspected reference-only images are in the ignored `artifacts/references/` directory. They are not included in the website or its deployment archive. Visible features include the glossy red body, large white cockpit/upper-cover area, carbon wings and halo, blue rear-wing accent, deeply undercut sidepods, tall boards behind the front wheels, sculpted front wing, and uncovered tyres. The front render uses number 16 and the rear-quarter render number 44; do not accidentally mix driver numbers in one livery.

## Verified 2026 constraints

FIA Section C Technical Regulations, Issue 20. Published 5 August 2026, approved 3 August 2026:

https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_20_-_2026-08-05.pdf

- C2.3.3: wheelbase no greater than 3,400 mm at Legality Setup.
- C2.3.1: bodywork stays within ±950 mm, excluding tyres, rims and attached rim parts. This is not an exact tyre-to-tyre envelope.
- C3.10.1 and C3.11.1: up to three profile volumes for front and rear wings. Adjustable front and rear flap geometry must be distinguished from fixed profiles.
- C10.7.2: rim outer-lip diameter 496 ±0.5 mm. Overall reference rim widths: 334 mm front, 420.3 mm rear. Tyre mounting widths: 315 ±0.5 mm front and 401.3 ±0.5 mm rear.

These are regulation constraints, not a Ferrari CAD specification. In particular, do not describe the maximum permitted wheelbase as Ferrari's verified actual wheelbase.

Pirelli's official 2026 tyre artwork confirms slick nominal sizes 280/705 R18 front and 375/710 R18 rear. The first number is tread width, not the entire inflated sidewall envelope. Overall sidewall dimensions were not verified. The 705/710 mm values specify front/rear slick diameters.

https://press.pirelli.com/pirelli-reveals-2026-f1-tyres-a-fresh-logo-design-and-new-compounds/

https://content.presspage.com/uploads/2363/b1bc7488-1a3c-4845-acac-edabd8e9bccc/2026-tyrerange.jpg?71662

## Component corrections required

- Replace the four-element front wing with the selected SF-26 three-profile geometry and active flaps.
- Replace the generic rear wing; remove the lower beam wing.
- Add the visible front-wheel wake-control boards. Do not add pre-2026 wheel eyebrow arches.
- Replace the floor/tunnel description and geometry with a 2026 flatter-floor/rear-diffuser arrangement, using Ferrari reference surfaces where available.
- Match Ferrari's push-rod suspension at both axles, rather than merely changing labels on generic wishbones.
- Separate the actual removable body panels, brake assemblies, front/rear suspension, wheels, and powertrain according to the source asset's real mesh hierarchy.
- The 2026 powertrain includes turbo V6, turbocharger, MGU-K, energy store and control electronics. No MGU-H. Ferrari's concealed geometry and exact packaging remain unverified.

Official explanations:

https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-new-aerodynamics.7IAt0auc32UkCEFE5ypkTB.7IAt0auc32UkCEFE5ypkTB

https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-new-power-units.14jfv7a36905uDJDdNyfQd

Ferrari-authored specification sheet mirrored by ANSA identifies the 067/6 1,600 cc 90-degree V6, single turbo, MGU-K, eight-speed longitudinal gearbox, Brembo carbon brakes and push-rod suspension front/rear. It lists 770 kg including driver, oil and water. It does not provide component CAD or external dimensional drawings:

https://www.ansa.it/documents/1769167532298_SF26.pdf

## Source asset availability

AviaRigg's SF-26 page advertises a detailed model with both driver liveries and an FBX export. However, its public Sketchfab metadata reports `isDownloadable: false`; the description directs users to a paid package. The embedded preview has 441,088 triangles. Individual mesh separability and internal completeness are not verified. No protected viewer geometry has been downloaded.

https://sketchfab.com/3d-models/downloadable-formula-1-ferrari-sf-26-2f71aa359b10411584806501d864df16

CGTrader's 3dreamracer SF26 listing describes 55 individual parts, approximately 61,000 polygons, and BLEND/FBX/OBJ formats. It was listed at $99 during research. This is a third-party model, not authenticated Ferrari CAD; check the licence and component contents before choosing it.

https://www.cgtrader.com/3d-models/car/racing-car/ferrari-sf26-formula-1-car-2026

## Accuracy boundary and next step

An identical external and internal assembly cannot be established from public regulations and launch photography alone. A licensed, component-separated source model is needed for a faithful mesh replacement; exact internal identity additionally requires authenticated source CAD. The user explicitly chose "Wait for my licensed 3D/CAD model" instead of a photo-based reconstruction. On resuming, no GLB, glTF, FBX, OBJ, BLEND, STEP, IGES or model ZIP archive was present in the project.

The user subsequently instructed the agent to find a licensed model and start implementing, then requested free alternatives. The GLB/FBX import, mapped assembly, selection and disassembly path is now implemented; see `docs/SF26-ASSET-INTEGRATION.md`. A free Excalibur SF-26 GP4 archive has been inspected; its readme requires permission for modifications, so conversion and web use remain unresolved. See `docs/references/free-f1-models.md` for the audit and verified Creative Commons fallbacks. Keep the current concept clearly identified until an authorized asset is installed and verified. Do not publish or upload project source: the previous publishing approval remains outstanding.
