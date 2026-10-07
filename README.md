# Purl Studio

An original visual sweater builder for seamless, top-down raglans. Design a sweater, see a live parametric fashion flat, and generate a deterministic knitting pattern using your own gauge.

## Run locally

Requires **Node.js 22 or newer**. There are no npm dependencies and no install step.

```sh
npm run dev
# Open http://127.0.0.1:5173
npm test
npm run build
```

You can also run `node scripts/serve.mjs`, `node --test`, and `node scripts/build.mjs` directly. Set `PORT` to change the local server port. The development server listens on loopback only. The build produces a portable static `dist/` directory; deploy its contents with any static host. Relative asset URLs support subdirectory hosting. No backend, API keys, account, or LLM service is required. Google Fonts is optional and has local serif/sans-serif fallbacks; no design data is sent to it.

## Included

- XS–XXL with an explicit house body-measurement chart.
- Regular (+10 cm target ease) and oversized (+20 cm) fits; actual rounded ease is always visible.
- Six illustrated neckline choices: crew, wide crew, mock neck, turtleneck, boat and V-neck; optional compatible German short-row back rise; 1×1 / 2×2 rib.
- Regular / wide sleeves, custom body and sleeve lengths, neckband, hem and cuff heights.
- Custom washed stitch and round gauge and needle size.
- Advanced yoke-depth override and swatch-based yarn budget.
- Parametric SVG front view with colour swatches, changing proportions, seams and ribbing.
- Finished measurements, rounding notes and actionable structural errors.
- Step-by-step pattern with exact body/sleeve increase schedules and sleeve decrease rounds.
- Text download and print layout for saving a PDF through your browser.
- Responsive layout, semantic controls, keyboard focus, live measurements and error announcements.
- Automated tests and GitHub Actions test/build workflow.

Designs live in the current page only; refreshing resets the defaults. Download your pattern before leaving.

## Architecture

```text
src/engine/model.js       Supported design schema, defaults, limits and body chart
src/engine/calculate.js   Pure calculation, schedules, conservation validation
src/engine/necklines.js   Neckline profiles and construction compatibility
src/engine/neckline-pattern.js  Flat V-yoke and collar-specific instructions
src/engine/pattern.js     Deterministic prose derived from the validated ledger
src/ui/preview.js         SVG projection of finished measurements
src/ui/neckline-preview.js     Neckline thumbnails and drawing geometry
src/ui/app.js             Design interactions and rendering
src/ui/styles.css         Original visual system, responsive and print styles
test/engine.test.js       Original raglan regression suite
test/necklines.test.js    Six-neckline matrix, flat-yoke and compatibility cases
```

The engine has no DOM or visual dependencies. `calculate(input)` returns either `{ ok: false, errors, warnings }` or a versioned structured result. `makePattern(result)` checks conservation again before generating instructions. UI colour and drawing geometry never determine stitch counts.

New construction modules should implement the same validated-result contract and have independent conservation tests. Add supported options deliberately in `model.js`; unsupported constructions and necklines currently fail validation instead of silently falling back. A future custom-measurement adapter can replace the house chart. Future colourwork repeat constraints belong in the engine before rendering prose or preview. Do not treat gauge, repeat compatibility, or shaping as presentation concerns.

## Calculation contract

All input dimensions are centimetres; gauge is per 10 cm. Internal dimensions retain full precision; displayed dimensions use one decimal place.

1. Each neckline has its own target opening and front/back allocation. The circular reference neck count rounds to a multiple of 4 and reserves at least 8 stitches per sleeve. Closed necklines start with equal front/back panels, equal sleeves and four single raglan stitches. V-neck begins with only 1 stitch per front edge; paired edge cast-ons replace the missing front stitches during the flat yoke.
2. Body targets round to a multiple of 4 to preserve equal panels and paired increases. Underarms round to a multiple of 4. Upper arms and cuffs round to the selected rib repeat (2 or 4).
3. All four raglan stitches stay on the body at separation. Let `F` be the initial front count, `S` the initial sleeve count, `U` the cast-on count at **each** underarm, `B` the final body count, and `A` the final sleeve count. Body increase events are `(B - 2U - 2(F + 2)) / 4`. Sleeve increase events are `(A - U - S) / 2`. Each event adds two stitches to each affected panel.
4. Body and sleeve schedules are independent. Events are evenly distributed, preferably on alternate rounds. For V-neck, flat-section increases occur only on right-side rows; the remainder uses circular rounds. Consecutive increase rounds are allowed when needed and explicitly warned about. More than one paired increase event per panel per round is not supported; impossible schedules block generation. The final yoke round is plain.
5. For crew, wide crew, mock and turtle necklines, three optional German short-row pairs raise the back by six local rows without changing stitch counts. Boat neck omits this rise to keep a shallow symmetrical opening. V-neck replaces it with front-edge shaping and has no resolution round. A separate full resolution round adds one front round. The yoke schedule starts after that round. Front and back lengths are reported separately.
6. Front body length is **below the neckband to hem**, including the yoke and hem. For V-neck it is the vertical shoulder/back-neck-base datum to hem, not V-point to hem. Sleeve length is **underarm to cuff**, including the pickup round and cuff. The body separation round and sleeve pickup round each count as round 1 of their respective sections. No sleeve decrease happens on the pickup round.
7. Paired sleeve decreases remove exactly two stitches each and end at the rib-compatible cuff count. If they cannot fit before the cuff, generation stops.
8. Maximum rounding error: body/neck circumference `2 / stitchesPerCm`; upper-arm/cuff circumference `repeat / (2 × stitchesPerCm)`; requested front/sleeve length `0.5 / roundsPerCm`. These are nearest-repeat / nearest-round bounds, not promises about real knitted fabric.

`validateResult` independently checks cast-on distribution, end-of-yoke conservation, underarm accounting, rib compatibility, shaping schedules and cuff endpoints. Tests simulate round-by-round shaping across **336 size/fit/sleeve/rib/gauge combinations**, including fractional gauges, as well as a hand-checked default ledger, input rejection, impossible geometry, short-row accounting and pattern rendering.

## Fit assumptions and limits

This is a working mathematical MVP, **not a physically test-knitted commercial pattern**. Swatch and try on. House sizes are explicit product defaults, not a universal sizing standard. Yoke shape, neck comfort and actual fit depend on personal proportions and fabric behaviour; an adult tech editor and physical samples should validate release patterns.

The same entered gauge is used to estimate stockinette and rib dimensions. Ribbing contracts, so cuff/neck measurements are nominal gauge-derived circumferences. Swatch ribbing separately and confirm the neck edge stretches over your head. The drawing is an illustrative front fashion flat, not a sewing template or a drape simulation.

Yarn estimates require a measured dry 10×10 cm swatch mass. The estimate approximates garment surface area, adds 15%, and rounds up to whole balls. It cannot guarantee usage for all fibres, stitch structures, or knitters. Without swatch mass the pattern explains that a reliable quantity cannot be inferred from gauge alone.

Six neckline profiles are implemented for raglan. Other constructions, colourwork, custom body measurements, accounts and saved-project storage remain future work. Construction compatibility and gauge/geometry checks disable unavailable neckline cards with visible reasons. The calculation API enforces the same rules independently of the UI.

## Technique references

The interface, pattern wording and calculation code are original. General technique background was checked against [Tin Can Knits' top-down raglan tutorial](https://blog.tincanknits.com/2013/10/25/lets-knit-a-sweater/) and [The Knitting Guild Association's discussion of differing raglan increase rates](https://tkga.org/wp-content/uploads/2026/02/TC_KAL_A-Study-in-Contrasts_Final_upload-REV-16FEB26.pdf). No third-party pattern text or grading table is included.

## Verification

```sh
npm test         # Core calculation matrix and failure cases
npm run build   # Static delivery output
```

Browser checks should cover all four design steps, fit/size changes, valid and invalid gauge edits, preview changes, printable pattern, download and narrow viewport layout. See `QA.md` for the implementation-time verification record.

## Neckline construction details

The dedicated **Step 3 — Neckline** shows six original thumbnails and live cast-on counts. Selecting a neckline applies its collar-height default; the height can then be adjusted within a shape-specific range. Crew uses the house neck measurement, wide crew adds 10 cm, mock subtracts 2 cm, turtle subtracts 4 cm, and boat adds 14 cm. These are explicit design presets rather than universal fit standards. Mock collars stand upright; turtle collars are knitted at full height and folded outward in half. Boat uses a larger front/back share and a shallow symmetric opening.

V-neck works an open raglan yoke flat, with one initial stitch on each front edge. Neckline edge cast-ons are counted separately from raglan increases. Neckline and flat raglan shaping occur only on right-side rows. The flat section ends after an even (wrong-side) row, then the next row joins without extra stitches. The same row counter continues through the circular yoke. Its round origin stays at centre front for separation, avoiding an uncounted partial round to relocate the marker. The finished fronts must equal the back before joining.

The V band is picked up after both sleeves and worked flat with two garter selvedges. Its interior count fits the selected 1×1/2×2 repeat; the two short band ends overlap and are secured at the V point. The body remains seamless; this neckline finish has small securing seams. The original open-yoke cast-on does not need a rib multiple because it is stockinette, not the neckband. Pickups are estimated from the initial cast-on edge and two sloping edges; unusual edge tension requires physical fitting.

Tests simulate **2,016 combinations** across all six necklines, XS–XXL, both fits, sleeve widths and rib types, and seven gauge pairs. They verify per-row conservation, right-side-only flat shaping, exact front/back equality at the join, neckline pickup accounting, body/sleeve targets and rib compatibility. The original 336-case crew regression also remains.

Technique background for the new shaping: [The Knitting Guild Association: top-down raglan framework](https://tkga.org/wp-content/uploads/issue_archives/2010/Top-Down%20Raglan%20Pullover%20Lesson.pdf) and [Machine Knitting Monthly: overlapping V-neck band ends](https://machineknittingmonthly.net/helpline/v_neckbands/). The implementation and pattern wording are original. New neckline variants have not been physically test-knitted.
