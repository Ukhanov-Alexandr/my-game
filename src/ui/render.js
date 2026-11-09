// Отрисовка поля и луча на canvas.
import { cellAt } from './grid.js';

export function draw(ctx, level, beam, cursor, cs, solved) {
  const w = level.width * cs, h = level.height * cs;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12151f';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#232a3d';
  ctx.lineWidth = 1;
  for (let i = 0; i <= level.width; i++) { ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, h); ctx.stroke(); }
  for (let j = 0; j <= level.height; j++) { ctx.beginPath(); ctx.moveTo(0, j * cs); ctx.lineTo(w, j * cs); ctx.stroke(); }

  // Луч
  ctx.strokeStyle = solved ? '#7dffb0' : '#ffd85e';
  ctx.lineWidth = Math.max(3, cs / 10);
  ctx.lineCap = 'round';
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = cs / 4;
  ctx.beginPath();
  beam.path.forEach((p, i) => {
    const px = (p.x + 0.5) * cs, py = (p.y + 0.5) * cs;
    const prev = beam.path[i - 1];
    // между несвязанными точками (разные лучи) — разрыв
    if (i === 0 || Math.abs(prev.x - p.x) + Math.abs(prev.y - p.y) !== 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  const lit = new Set(beam.litCrystals.map((c) => `${c.x},${c.y}`));
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const c = cellAt(level, x, y);
      const cx = (x + 0.5) * cs, cy = (y + 0.5) * cs, r = cs * 0.34;
      if (c.type === 'wall') {
        ctx.fillStyle = '#3a4260';
        ctx.fillRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4);
      } else if (c.type === 'emitter') {
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      } else if (c.type === 'crystal') {
        ctx.fillStyle = lit.has(`${x},${y}`) ? '#7dffb0' : '#5b6fa8';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath(); ctx.fill();
      } else if (c.type === 'mirror') {
        ctx.strokeStyle = c.locked ? '#8a93b5' : '#9fe3ff';
        ctx.lineWidth = Math.max(4, cs / 9);
        const d = cs * 0.34, s = c.mirror === '/' ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(cx - d, cy - s * d); ctx.lineTo(cx + d, cy + s * d); ctx.stroke();
      }
    }
  }

  // Курсор
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(cursor.x * cs + 2, cursor.y * cs + 2, cs - 4, cs - 4);
}
