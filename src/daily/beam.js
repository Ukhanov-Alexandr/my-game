// ВРЕМЕННАЯ копия трассировки луча.
// Настоящие правила живут в src/core/ (их пишет отдельный тред). Пока ядра нет
// в main, генератору нужно самому проверять уровни, поэтому здесь лежит
// минимальная версия по общему контракту. Когда src/core/ появится, этот файл
// нужно удалить, а импорты в generator.js заменить на '../core/index.js'.
//
// Контракт уровня: { width, height, cells }, где cells[y][x] — клетка
// { type: 'empty'|'wall'|'emitter'|'mirror'|'crystal', dir?, mirror?: '/'|'\\', locked? }.
// Ось y направлена вниз, как на экране.

export const STEP = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

/** Куда повернёт луч, попав на зеркало. */
export const REFLECT = {
  '/': { right: 'up', up: 'right', left: 'down', down: 'left' },
  '\\': { right: 'down', down: 'right', left: 'up', up: 'left' },
};

/**
 * Проводит луч от фонаря и собирает освещённые кристаллы.
 * @returns {{ path: {x:number,y:number,dir:string}[], litCrystals: {x:number,y:number}[] }}
 */
export function traceBeam(level) {
  const path = [];
  const litCrystals = [];
  const emitter = findEmitter(level);
  if (!emitter) return { path, litCrystals };

  const seenStates = new Set();
  const seenCrystals = new Set();
  let { x, y } = emitter;
  let dir = level.cells[y][x].dir;

  while (true) {
    x += STEP[dir].dx;
    y += STEP[dir].dy;
    if (x < 0 || y < 0 || x >= level.width || y >= level.height) break;

    const cell = level.cells[y][x];
    if (cell.type === 'wall' || cell.type === 'emitter') break;

    const state = `${x},${y},${dir}`;
    if (seenStates.has(state)) break; // луч зациклился
    seenStates.add(state);

    path.push({ x, y, dir });
    if (cell.type === 'crystal' && !seenCrystals.has(`${x},${y}`)) {
      seenCrystals.add(`${x},${y}`);
      litCrystals.push({ x, y });
    }
    if (cell.type === 'mirror') dir = REFLECT[cell.mirror][dir];
  }
  return { path, litCrystals };
}

/** Уровень решён, если луч освещает все кристаллы. */
export function isSolved(level) {
  const total = countCrystals(level);
  return total > 0 && traceBeam(level).litCrystals.length === total;
}

export function countCrystals(level) {
  let total = 0;
  for (const row of level.cells) for (const cell of row) if (cell.type === 'crystal') total++;
  return total;
}

function findEmitter(level) {
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (level.cells[y][x].type === 'emitter') return { x, y };
    }
  }
  return null;
}
