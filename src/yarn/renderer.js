import { describeStrand } from './catalog.js';
import { activeStrands } from './state.js';

// Seeded geometry is independent of color and zoom. Future stitch types can supply
// different centerline paths while reusing the strand and fiber rendering layers.
export function randomSource(seed = 2718) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function tone(hex, amount) {
  const values = hex.slice(1).match(/../g).map(v => parseInt(v, 16));
  return `rgb(${values.map(v => Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))).join(',')})`;
}
function loop(ctx, x, y, side, offset = 0) {
  ctx.beginPath();
  ctx.moveTo(x + side * 1.1 + offset, y + 12);
  ctx.bezierCurveTo(x + side * 8 + offset, y + 5, x + side * 11 + offset, y - 4, x + side * 7 + offset, y - 9);
  ctx.bezierCurveTo(x + side * 5 + offset, y - 12, x + side * 1.5 + offset, y - 7, x + side * 2.2 + offset, y - 3);
  ctx.stroke();
}
export function renderSwatch(canvas, combination, { zoom = 1, thumbnail = false } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = thumbnail ? 420 : 1080;
  canvas.width = size; canvas.height = size;
  const strands = activeStrands(combination).map(describeStrand);
  const random = randomSource();
  ctx.scale(size / 720, size / 720);
  ctx.fillStyle = '#eeede6'; ctx.fillRect(0, 0, 720, 720);
  ctx.save(); ctx.translate(360, 360); ctx.scale(zoom, zoom); ctx.translate(-360, -360);
  ctx.fillStyle = '#00000015'; ctx.shadowColor = '#282b2440'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 13;
  ctx.beginPath(); ctx.roundRect(77, 71, 566, 578, 12); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.save(); ctx.beginPath(); ctx.roundRect(76, 65, 568, 580, 9); ctx.clip();
  ctx.fillStyle = tone(strands[0].color.hex, -0.43); ctx.fillRect(76, 65, 568, 580);
  ctx.lineCap = 'round';
  for (let row = 0; row < 34; row++) {
    for (let column = 0; column < 26; column++) {
      const x = 85 + column * 22 + (random() - 0.5) * 1.1;
      const y = 67 + row * 17.5 + (random() - 0.5) * 0.9;
      const light = random() * 0.055;
      for (const side of [-1, 1]) {
        ctx.strokeStyle = '#161b162d'; ctx.lineWidth = 12; loop(ctx, x + 1, y + 2, side);
        const total = strands.length;
        strands.forEach(({ yarn, color }, s) => {
          const offset = total === 1 ? 0 : (s === 0 ? -1.6 : 2);
          const width = total === 1 ? 8.5 : yarn.texture === 'halo' ? 3.7 : 6.1;
          ctx.strokeStyle = tone(color.hex, -0.25 + light); ctx.lineWidth = width + 1.2; loop(ctx, x, y, side, offset);
          ctx.strokeStyle = tone(color.hex, light); ctx.lineWidth = width; loop(ctx, x - 0.35, y - 0.5, side, offset);
          ctx.strokeStyle = tone(color.hex, 0.25 + light); ctx.lineWidth = width * 0.25; loop(ctx, x - 1.1, y - 0.8, side, offset);
          ctx.globalAlpha = 0.35;
          for (let fiber = 0; fiber < 3; fiber++) {
            ctx.strokeStyle = tone(color.hex, fiber % 2 ? -0.25 : 0.4); ctx.lineWidth = 0.38;
            loop(ctx, x, y, side, offset + (fiber - 1) * width * 0.26);
          }
          ctx.globalAlpha = 1;
        });
      }
      // The held strands twist across the face of each stitch, preserving both colors.
      if (strands.length === 2) {
        ctx.strokeStyle = tone(strands[(row + column) % 2].color.hex, 0.1); ctx.globalAlpha = 0.6; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x - 5, y + 2); ctx.bezierCurveTo(x - 3, y - 1, x + 3, y + 7, x + 5, y + 3); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
  }
  ctx.restore();
  for (const { yarn, color } of strands) {
    const count = Math.round(2600 * yarn.characteristics.fuzz);
    ctx.strokeStyle = color.hex; ctx.lineWidth = 0.55;
    for (let i = 0; i < count; i++) {
      const x = 79 + random() * 562, y = 69 + random() * 572;
      const length = 3 + random() * (yarn.texture === 'halo' ? 21 : 5), angle = random() * Math.PI * 2;
      ctx.globalAlpha = 0.1 + random() * 0.25;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(angle + 0.7) * length * 0.6, y + Math.sin(angle + 0.7) * length * 0.6,
        x + Math.cos(angle) * length, y + Math.sin(angle) * length); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.restore();
}
