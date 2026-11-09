// Решатель: ищет, какие зеркала повернуть, чтобы зажечь все кристаллы.
// Нужен тестам (каждый уровень должен иметь решение), генератору уровня дня
// и, при желании, подсказкам в интерфейсе.
//
// Как он думает. У каждого зеркала всего два положения. Решатель пускает луч,
// и когда луч впервые доходит до незакреплённого зеркала, пробует оба
// положения по очереди. Зеркала, до которых луч не дошёл, ни на что не влияют,
// поэтому их он не перебирает. Так перебор намного меньше, чем «все зеркала
// во всех положениях».

import { trace, countCrystals } from './beam.js';
import { rotateMirror } from './level.js';

/**
 * Решает уровень.
 * Возвращает null, если решения нет, иначе:
 *   {
 *     rotations: [{ x, y }],  // какие зеркала повернуть (по одному разу) —
 *                             // самый короткий вариант из найденных
 *     level,                  // уровень после этих поворотов (решённый)
 *     solutionCount,          // сколько разных решений нашлось
 *     steps,                  // сколько вариантов перепробовал решатель —
 *                             // грубая мера сложности уровня
 *   }
 * options.maxSteps — предел перебора (по умолчанию 200 000), чтобы огромный
 * уровень не подвесил страницу. Если предел превышен, будет ошибка.
 */
export function solve(level, options = {}) {
  const maxSteps = options.maxSteps ?? 200_000;
  const total = countCrystals(level);
  if (total === 0) return null;

  const choice = new Map(); // "x,y" → '/' или '\\'
  let steps = 0;
  let best = null;
  let solutionCount = 0;

  const mirrorAt = (cell, x, y) => (cell.locked ? cell.mirror : choice.get(`${x},${y}`));

  function search() {
    if (++steps > maxSteps) throw new Error('Слишком большой перебор: уровень сложный для решателя');

    const result = trace(level, mirrorAt);
    if (result.stoppedAt) {
      const { x, y } = result.stoppedAt;
      const key = `${x},${y}`;
      const current = level.cells[y][x].mirror;
      const other = current === '/' ? '\\' : '/';
      for (const option of [current, other]) {
        choice.set(key, option);
        search();
      }
      choice.delete(key);
      return;
    }

    if (result.litCrystals.length !== total) return;
    solutionCount++;
    const rotations = [];
    for (const [key, mirror] of choice) {
      const [x, y] = key.split(',').map(Number);
      if (level.cells[y][x].mirror !== mirror) rotations.push({ x, y });
    }
    if (!best || rotations.length < best.length) best = rotations;
  }

  search();
  if (!best) return null;

  best.sort((a, b) => a.y - b.y || a.x - b.x);
  let solved = level;
  for (const { x, y } of best) solved = rotateMirror(solved, x, y);
  return { rotations: best, level: solved, solutionCount, steps };
}
