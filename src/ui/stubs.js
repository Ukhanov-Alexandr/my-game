// Временные заглушки на случай, если соседние модули ещё не влиты в main.
// Когда src/core, src/levels, src/daily, src/audio появятся, эти заглушки не используются.
import { cellAt, DIRS } from './grid.js';

const SLASH = { right: 'up', up: 'right', left: 'down', down: 'left' };
const BACK = { right: 'down', down: 'right', left: 'up', up: 'left' };

export const core = {
  traceBeam(level) {
    const path = [];
    const lit = new Set();
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const c = cellAt(level, x, y);
        if (c?.type !== 'emitter') continue;
        let [cx, cy, dir] = [x, y, c.dir];
        const seen = new Set();
        path.push({ x: cx, y: cy });
        for (;;) {
          cx += DIRS[dir].dx; cy += DIRS[dir].dy;
          const cell = cellAt(level, cx, cy);
          if (!cell || cell.type === 'wall' || cell.type === 'emitter') break;
          const key = `${cx},${cy},${dir}`;
          if (seen.has(key)) break;
          seen.add(key);
          path.push({ x: cx, y: cy });
          if (cell.type === 'crystal') { lit.add(`${cx},${cy}`); break; }
          if (cell.type === 'mirror') dir = (cell.mirror === '/' ? SLASH : BACK)[dir];
        }
      }
    }
    return { path, litCrystals: [...lit].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y }; }) };
  },
  rotateMirror(level, x, y) {
    const c = cellAt(level, x, y);
    if (c?.type !== 'mirror' || c.locked) return level;
    const rows = Array.isArray(level.cells[0]);
    const cells = rows ? level.cells.map((r) => r.slice()) : level.cells.slice();
    const next = { ...c, mirror: c.mirror === '/' ? '\\' : '/' };
    if (rows) cells[y][x] = next; else cells[y * level.width + x] = next;
    return { ...level, cells };
  },
  isSolved(level) {
    let total = 0;
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) if (cellAt(level, x, y)?.type === 'crystal') total++;
    return total > 0 && this.traceBeam(level).litCrystals.length === total;
  },
};

const W = { type: 'wall' }, E = { type: 'empty' }, C = { type: 'crystal' };
const L = { type: 'emitter', dir: 'right' };
const M = (m) => ({ type: 'mirror', mirror: m });
export const levels = [{
  width: 5, height: 4,
  cells: [
    L, E, E, M('/'), E,
    E, W, E, E, E,
    E, E, E, M('/'), E,
    C, E, E, E, E,
  ],
}];
export const getDailyLevel = () => levels[0];
export const audio = { playRotate() {}, playWin() {}, setMuted() {} };
