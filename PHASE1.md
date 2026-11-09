# Phase 1 design workspace

Entry point: index.html. Previous applications remain at journey.html, sweater.html,
swatch.html and yarn.html, accessible from the workspace menu. Their storage keys,
engines and tests are preserved. New design data uses separate versioned keys.

## Modules and state

src/workspace/state.js owns validated design data, persistence and rendererInput.
components.js contains the named workspace components; app.js handles transitions
and transactional dialogs. catalog.js separates product metadata from image
provenance. pattern.js supplies repeat data and explicitly schematic previews.
assets.js maps approved reference combinations to photos, with explicit fallbacks.
All 54 construction/fit/neck/sleeve combinations are selectable and persisted.
Only the 12 classic standard/short combinations have exact garment photographs.

Pattern colors and held-together strands are independent. Pattern presets retain
individual settings when switched. Saves update by ID; copies get new IDs. Delete
has Undo. Export/import makes browser-local data portable. Corrupt prior storage
is preserved rather than silently overwritten. No backend or account sync added.

## Image provenance and limitations

Seven unchanged images supplied by the user on 2026-11-09 are in
src/workspace/assets. SVG viewports select garment/swatch regions; no screenshot
is used as the interface. Controls, dialogs, previews and saving are real HTML.
These are approved visual references, not verified manufacturer product photos.
The peach and red textures are likewise labeled references. Do not imply that
these establish exact commercial color matching or grant third-party licenses.

Official product metadata/color codes checked against:
- https://isagerstrik.dk/en/product/tvinni/
- https://isagerstrik.dk/en/product/silk-mohair/

No reusable official product-image license was confirmed. Other catalog entries
therefore use explicitly labeled missing-image placeholders, not invented photos.
Color swatches are illustrative, and no unofficial color names are assigned.

The photographed checker sweater is shown only for its matching default model,
repeat and reference colors. Other choices show a neutral shape reference plus
a separate schematic pattern. Four matching swatch presets use supplied photos;
custom colors/repeats and diamonds use schematic views. Gauge and grid are
illustrative estimates, never a verified knitting gauge. Phase 2 photorealistic
material rendering and new knitting calculations are deliberately not implemented.

## Validation

39 automated tests pass, including existing knitting engine regression tests.
New tests cover all 54 garment combinations, save/update/copy/delete/recovery,
corrupt storage preservation, strand/color independence, exact pattern repeats
and honest reference eligibility. JavaScript syntax and static build checked.
Browser QA: 1940 × 1282 desktop and 390 × 844 mobile, garment selection/cancel,
Set-in boat short image, sweater/swatch switching, yarn pagination/search/select,
strand add/remove, save and reload/reopen, dots/settings/grid. No horizontal
mobile overflow observed. Browser data is local to the origin used for testing.
