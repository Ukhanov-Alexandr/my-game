// Как идёт луч. Только правила, без отрисовки.
//
// Луч выходит из фонаря в сторону dir и летит по клеткам:
//   • пустая клетка — летит дальше;
//   • кристалл — загорается, луч проходит сквозь него дальше;
//   • зеркало — луч поворачивает (см. REFLECT ниже);
//   • стена, фонарь или край поля — луч останавливается.
// Если луч зациклился (снова пришёл в ту же клетку с той же стороны), он
// останавливается — дальше всё повторялось бы.

import { getCell } from './level.js';

/** Сдвиг по x и y для каждого направления. y растёт вниз. */
export const STEP = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

/**
 * Куда повернёт луч, летящий в направлении dir, от зеркала.
 * «/» : летел вправо → вверх, вверх → вправо, влево → вниз, вниз → влево.
 * «\» : летел вправо → вниз, вниз → вправо, влево → вверх, вверх → влево.
 */
export const REFLECT = {
  '/': { right: 'up', up: 'right', left: 'down', down: 'left' },
  '\\': { right: 'down', down: 'right', left: 'up', up: 'left' },
};

/**
 * Прокладывает лучи от всех фонарей.
 *
 * Возвращает { path, litCrystals }:
 *   path — клетки, через которые прошёл свет, по порядку:
 *     { x, y, in, out }
 *     in  — куда летел луч, входя в клетку (null для клетки самого фонаря);
 *     out — куда луч летит, выходя из клетки. Если следующая клетка — стена,
 *           фонарь или край поля, луч упирается в край этой клетки.
 *     Если фонарей несколько, их пути идут друг за другом.
 *   litCrystals — освещённые кристаллы { x, y }, каждый по одному разу.
 */
export function traceBeam(level) {
  const result = trace(level, (cell) => cell.mirror);
  return { path: result.path, litCrystals: result.litCrystals };
}

/**
 * Общий движок для traceBeam и решателя.
 * mirrorAt(cell, x, y) говорит, как стоит зеркало в клетке. Если вернёт
 * undefined, трассировка прерывается и в ответе будет stoppedAt: { x, y }.
 */
export function trace(level, mirrorAt) {
  const path = [];
  const litCrystals = [];
  const litKeys = new Set();
  const visited = new Set(); // "x,y,in" — чтобы не ходить по кругу

  for (let ey = 0; ey < level.height; ey++) {
    for (let ex = 0; ex < level.width; ex++) {
      const emitter = level.cells[ey][ex];
      if (emitter.type !== 'emitter') continue;

      path.push({ x: ex, y: ey, in: null, out: emitter.dir });
      let x = ex;
      let y = ey;
      let dir = emitter.dir;

      for (;;) {
        const nx = x + STEP[dir].dx;
        const ny = y + STEP[dir].dy;
        const cell = getCell(level, nx, ny);
        if (!cell || cell.type === 'wall' || cell.type === 'emitter') break;

        const key = `${nx},${ny},${dir}`;
        if (visited.has(key)) break;
        visited.add(key);

        let out = dir;
        if (cell.type === 'mirror') {
          const mirror = mirrorAt(cell, nx, ny);
          if (mirror === undefined) {
            return { path, litCrystals, stoppedAt: { x: nx, y: ny } };
          }
          out = REFLECT[mirror][dir];
        } else if (cell.type === 'crystal') {
          const k = `${nx},${ny}`;
          if (!litKeys.has(k)) {
            litKeys.add(k);
            litCrystals.push({ x: nx, y: ny });
          }
        }

        path.push({ x: nx, y: ny, in: dir, out });
        x = nx;
        y = ny;
        dir = out;
      }
    }
  }
  return { path, litCrystals, stoppedAt: null };
}

/** Сколько кристаллов на поле. */
export function countCrystals(level) {
  let n = 0;
  for (const row of level.cells) for (const cell of row) if (cell.type === 'crystal') n++;
  return n;
}

/** Уровень пройден, когда горят все кристаллы (и хотя бы один кристалл есть). */
export function isSolved(level) {
  const total = countCrystals(level);
  return total > 0 && traceBeam(level).litCrystals.length === total;
}
