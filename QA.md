# Verification record

## Automated

- Hand-checked default: 80 cast-on; 26 front, 26 back, 12 each sleeve, four raglan stitches; 33 body increase events and 26 sleeve increase events; 316 stitches at yoke end; 212 body stitches, 76 sleeve stitches including 12 picked-up underarm stitches; 16 paired decreases to 44 cuff stitches.
- 336 valid size/fit/sleeve/rib/gauge combinations, with round-by-round shaping simulation, exact rib compatibility and measured rounding bounds.
- Invalid numbers, unsupported options and malformed colour values rejected.
- Too-short body, too-short sleeve and too-shallow yoke blocked.
- Optional short-row rise and full-round accounting verified.
- Input immutability, determinism, validated pattern rendering and material-estimate behaviour verified.

## Browser

- Default design renders with the original Purl Studio interface and sweater flat.
- Regular → oversized updates finished bust and actual ease immediately.
- Wide sleeves, 2×2 rib and keyboard-adjusted length sliders update the illustration.
- Gauge 0 shows an actionable error and disables pattern generation; restoring 19 stitches / 27 rounds restores a valid pattern.
- Generated XS oversized / wide-sleeve / 2×2 pattern displays cast-on allocation, short rows, exact increase rounds, body separation and sleeve endpoints.
- Narrow viewport (390 px) reports equal document and viewport widths: no horizontal overflow.
- Static build and the Node test suite complete successfully.

## Not covered

Physical knitting samples, independent knitting tech editing and real-yarn fit testing remain necessary before presenting generated patterns as commercially tested designs.
