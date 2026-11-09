// Генератор уровней «Зеркала и луч».
// Идея: сначала строим правильный путь луча (фонарь → зеркала → кристаллы),
// потом добавляем лишние стены и зеркала-обманки, а в конце поворачиваем часть
// нужных зеркал неправильно. Так уровень всегда решаем: правильный ответ мы знаем.

import { STEP, REFLECT, isSolved } from './beam.js';

const DIRS = ['up', 'right', 'down', 'left'];
const TURNS = {
  up: ['left', 'right'],
  down: ['left', 'right'],
  left: ['up', 'down'],
  right: ['up', 'down'],
};
const MAX_ATTEMPTS = 1000;

/**
 * Создаёт решаемый и изначально нерешённый уровень.
 * @param {ReturnType<import('./random.js').createRng>} rng генератор случайных чисел
 * @returns {{ level: object, solution: {x:number,y:number,mirror:string}[] }}
 *   solution — как должны стоять зеркала на пути луча, чтобы уровень был решён.
 */
export function generateLevel(rng) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = tryGenerate(rng);
    if (result) return result;
  }
  throw new Error('Не удалось сгенерировать уровень');
}

function tryGenerate(rng) {
  const width = rng.int(6, 8);
  const height = rng.int(7, 9);
  const mirrorCount = rng.int(5, 7);

  const path = buildPath(rng, width, height, mirrorCount);
  if (!path) return null;

  const cells = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) row.push({ type: 'empty' });
    cells.push(row);
  }
  const level = { width, height, cells };
  const { emitter, segments, endWall, used } = path;

  cells[emitter.y][emitter.x] = { type: 'emitter', dir: emitter.dir };
  if (endWall) cells[endWall.y][endWall.x] = { type: 'wall' };

  const solution = [];
  for (const segment of segments) {
    if (segment.mirror) {
      const { x, y, mirror } = segment.mirror;
      cells[y][x] = { type: 'mirror', mirror };
      solution.push({ x, y, mirror });
    }
  }

  // Кристаллы ставим только на прямые участки пути. На первом участке (до первого
  // зеркала) кристалл горел бы всегда, поэтому он там не нужен. Последний участок
  // обязателен — иначе часть зеркал ни на что не влияла бы.
  let crystals = 0;
  for (let i = 1; i < segments.length; i++) {
    const straight = segments[i].straight;
    const isLast = i === segments.length - 1;
    if (straight.length === 0) {
      if (isLast) return null;
      continue;
    }
    if (isLast || rng.chance(0.6)) {
      const spot = rng.pick(straight);
      cells[spot.y][spot.x] = { type: 'crystal' };
      crystals++;
    }
  }
  if (crystals < 3) return null;

  // Обманки: лишние стены и зеркала вне пути луча. Решение они не ломают,
  // потому что правильный луч через эти клетки не проходит.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (used.has(key(x, y))) continue;
      const roll = rng.next();
      if (roll < 0.08) cells[y][x] = { type: 'wall' };
      else if (roll < 0.2) cells[y][x] = { type: 'mirror', mirror: rng.pick(['/', '\\']) };
    }
  }

  // Проверка: с правильно стоящими зеркалами уровень решён.
  if (!isSolved(level)) return null;

  // Перемешивание: поворачиваем не меньше половины нужных зеркал.
  const order = rng.shuffle(solution.map((_, i) => i));
  const minFlips = Math.max(2, Math.ceil(solution.length / 2));
  const untouched = [];
  let flips = 0;
  for (const i of order) {
    if (flips < minFlips || rng.chance(0.5)) {
      flipMirror(cells, solution[i]);
      flips++;
    } else {
      untouched.push(i);
    }
  }
  // Если после поворотов уровень случайно остался решённым — крутим ещё.
  while (isSolved(level)) {
    if (untouched.length === 0) return null;
    flipMirror(cells, solution[untouched.shift()]);
  }

  return { level, solution };
}

/**
 * Строит путь луча, который не пересекает сам себя.
 * Путь состоит из участков: несколько прямых клеток, затем зеркало.
 * Последний участок без зеркала: луч упирается в стену или уходит за край поля.
 */
function buildPath(rng, width, height, mirrorCount) {
  const emitter = placeEmitter(rng, width, height);
  const used = new Set([key(emitter.x, emitter.y)]);
  const free = (x, y) => inside(x, y, width, height) && !used.has(key(x, y));

  const segments = [];
  let { x, y, dir } = emitter;

  for (let i = 0; i < mirrorCount; i++) {
    const length = rng.int(1, 3); // сколько клеток пройти, последняя — зеркало
    const straight = [];
    for (let s = 0; s < length; s++) {
      x += STEP[dir].dx;
      y += STEP[dir].dy;
      if (!free(x, y)) return null;
      used.add(key(x, y));
      if (s < length - 1) straight.push({ x, y });
    }
    const turns = rng.shuffle(TURNS[dir]);
    const newDir = turns.find((d) => free(x + STEP[d].dx, y + STEP[d].dy));
    if (!newDir) return null;
    const mirror = REFLECT['/'][dir] === newDir ? '/' : '\\';
    segments.push({ straight, mirror: { x, y, mirror } });
    dir = newDir;
  }

  // Последний участок.
  const maxLength = rng.int(2, 5);
  const straight = [];
  while (straight.length < maxLength && free(x + STEP[dir].dx, y + STEP[dir].dy)) {
    x += STEP[dir].dx;
    y += STEP[dir].dy;
    used.add(key(x, y));
    straight.push({ x, y });
  }
  if (straight.length === 0) return null;

  let endWall = null;
  const nx = x + STEP[dir].dx;
  const ny = y + STEP[dir].dy;
  if (inside(nx, ny, width, height)) {
    // Клетка за концом пути уже занята путём — луч зашёл бы туда и пошёл дальше.
    if (used.has(key(nx, ny))) return null;
    endWall = { x: nx, y: ny };
    used.add(key(nx, ny));
  }
  segments.push({ straight, mirror: null });

  return { emitter, segments, endWall, used };
}

/** Фонарь стоит на краю поля (не в углу) и светит внутрь. */
function placeEmitter(rng, width, height) {
  const side = rng.pick(DIRS);
  if (side === 'up') return { x: rng.int(1, width - 2), y: 0, dir: 'down' };
  if (side === 'down') return { x: rng.int(1, width - 2), y: height - 1, dir: 'up' };
  if (side === 'left') return { x: 0, y: rng.int(1, height - 2), dir: 'right' };
  return { x: width - 1, y: rng.int(1, height - 2), dir: 'left' };
}

function flipMirror(cells, { x, y }) {
  const cell = cells[y][x];
  cell.mirror = cell.mirror === '/' ? '\\' : '/';
}

function inside(x, y, width, height) {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function key(x, y) {
  return `${x},${y}`;
}
