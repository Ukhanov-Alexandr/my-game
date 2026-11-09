// Тесты правил: запуск — `node --test` из корня проекта.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseLevel,
  levelToText,
  getCell,
  validateLevel,
  cloneLevel,
  rotateMirror,
  traceBeam,
  isSolved,
  solve,
  REFLECT,
} from '../../src/core/index.js';

const cellsOf = (path) => path.map(({ x, y }) => `${x},${y}`);

test('parseLevel и levelToText — взаимно обратные', () => {
  const map = ['>./\\*', '#Z.N.', '^v<..'];
  const level = parseLevel(map);
  assert.equal(level.width, 5);
  assert.equal(level.height, 3);
  assert.deepEqual(levelToText(level), map);
  assert.deepEqual(getCell(level, 0, 0), { type: 'emitter', dir: 'right' });
  assert.deepEqual(getCell(level, 1, 1), { type: 'mirror', mirror: '/', locked: true });
  assert.deepEqual(getCell(level, 3, 0), { type: 'mirror', mirror: '\\' });
  assert.equal(getCell(level, 5, 0), null);
  assert.equal(getCell(level, -1, 0), null);
});

test('parseLevel понимает многострочный текст и ругается на ошибки', () => {
  const level = parseLevel(`
    >.*
    ...
  `);
  assert.equal(level.width, 3);
  assert.equal(level.height, 2);
  assert.throws(() => parseLevel(['>..', '..']), /длиной/);
  assert.throws(() => parseLevel(['>?*']), /Неизвестный символ/);
  assert.throws(() => parseLevel(''), /Пустая/);
});

test('validateLevel находит ошибки', () => {
  assert.deepEqual(validateLevel(parseLevel(['>.*'])), []);
  assert.match(validateLevel(parseLevel(['..*'])).join(), /фонарь/);
  assert.match(validateLevel(parseLevel(['>..'])).join(), /кристалл/);
  const broken = { width: 2, height: 1, cells: [[{ type: 'emitter' }, { type: 'lava' }]] };
  const errors = validateLevel(broken).join('\n');
  assert.match(errors, /направления/);
  assert.match(errors, /Неизвестный тип/);
  assert.match(validateLevel({ width: 2, height: 2, cells: [[]] }).join(), /height строк/);
});

test('луч летит прямо до края поля', () => {
  const { path, litCrystals } = traceBeam(parseLevel(['>...']));
  assert.deepEqual(path, [
    { x: 0, y: 0, in: null, out: 'right' },
    { x: 1, y: 0, in: 'right', out: 'right' },
    { x: 2, y: 0, in: 'right', out: 'right' },
    { x: 3, y: 0, in: 'right', out: 'right' },
  ]);
  assert.deepEqual(litCrystals, []);
});

test('луч останавливается о стену и о другой фонарь', () => {
  assert.deepEqual(cellsOf(traceBeam(parseLevel(['>.#.*'])).path), ['0,0', '1,0']);
  const twoEmitters = traceBeam(parseLevel(['>.<']));
  assert.deepEqual(cellsOf(twoEmitters.path), ['0,0', '1,0', '2,0', '1,0']);
});

test('луч проходит сквозь кристаллы и зажигает каждый', () => {
  const { path, litCrystals } = traceBeam(parseLevel(['>*.*.']));
  assert.equal(path.length, 5);
  assert.deepEqual(litCrystals, [
    { x: 1, y: 0 },
    { x: 3, y: 0 },
  ]);
});

test('фонарь светит в свою сторону', () => {
  const level = parseLevel(['..*..', '.....', '*.^.*', '.....', '..*..']);
  assert.deepEqual(traceBeam(level).litCrystals, [{ x: 2, y: 0 }]);
  const down = parseLevel(['v', '.', '*']);
  assert.deepEqual(traceBeam(down).litCrystals, [{ x: 0, y: 2 }]);
  const left = parseLevel(['*.<']);
  assert.deepEqual(traceBeam(left).litCrystals, [{ x: 0, y: 0 }]);
});

test('зеркала поворачивают луч во все стороны', () => {
  // Таблица отражений целиком: «/» и «\» для каждого направления.
  assert.deepEqual(REFLECT['/'], { right: 'up', up: 'right', left: 'down', down: 'left' });
  assert.deepEqual(REFLECT['\\'], { right: 'down', down: 'right', left: 'up', up: 'left' });

  // И на настоящем поле: луч вправо, «/» уводит вверх, «\» — вниз.
  const up = parseLevel(['..*', '>./', '...']);
  assert.deepEqual(traceBeam(up).litCrystals, [{ x: 2, y: 0 }]);
  const down = parseLevel(['...', '>.\\', '..*']);
  assert.deepEqual(traceBeam(down).litCrystals, [{ x: 2, y: 2 }]);
  // Луч вверх: «/» уводит вправо, «\» — влево.
  const right = parseLevel(['/*', '^.']);
  assert.deepEqual(traceBeam(right).litCrystals, [{ x: 1, y: 0 }]);
  const left = parseLevel(['*\\', '.^']);
  assert.deepEqual(traceBeam(left).litCrystals, [{ x: 0, y: 0 }]);
});

test('в path записано, откуда луч пришёл и куда ушёл', () => {
  const { path } = traceBeam(parseLevel(['>\\', '.*']));
  assert.deepEqual(path, [
    { x: 0, y: 0, in: null, out: 'right' },
    { x: 1, y: 0, in: 'right', out: 'down' },
    { x: 1, y: 1, in: 'down', out: 'down' },
  ]);
});

test('луч может пересечь свой же путь', () => {
  // Луч идёт вправо, через три зеркала разворачивается, пересекает
  // сам себя в клетке (2,2) и спускается к кристаллу.
  const level = parseLevel(['../.\\', '.....', '>.../', '.....', '..*..']);
  const { path, litCrystals } = traceBeam(level);
  assert.equal(cellsOf(path).filter((c) => c === '2,2').length, 2);
  assert.deepEqual(litCrystals, [{ x: 2, y: 4 }]);
});

test('rotateMirror поворачивает зеркало и не меняет исходный уровень', () => {
  const level = parseLevel(['>/.']);
  const before = levelToText(level);
  const next = rotateMirror(level, 1, 0);
  assert.notEqual(next, level);
  assert.deepEqual(levelToText(next), ['>\\.']);
  assert.deepEqual(levelToText(level), before);
  assert.deepEqual(levelToText(rotateMirror(next, 1, 0)), ['>/.']);
});

test('rotateMirror ничего не делает с закреплённым зеркалом и не с зеркалом', () => {
  const level = parseLevel(['>Z.']);
  assert.equal(rotateMirror(level, 1, 0), level); // закреплено
  assert.equal(rotateMirror(level, 0, 0), level); // фонарь
  assert.equal(rotateMirror(level, 2, 0), level); // пусто
  assert.equal(rotateMirror(level, 9, 9), level); // за полем
});

test('rotateMirror сохраняет лишние поля уровня (id, name)', () => {
  const level = { id: 7, name: 'Тест', ...parseLevel(['>/']) };
  const next = rotateMirror(level, 1, 0);
  assert.equal(next.id, 7);
  assert.equal(next.name, 'Тест');
});

test('cloneLevel даёт независимую копию', () => {
  const level = parseLevel(['>/*']);
  const copy = cloneLevel(level);
  copy.cells[0][1].mirror = '\\';
  assert.equal(level.cells[0][1].mirror, '/');
});

test('isSolved: все кристаллы горят — уровень пройден', () => {
  assert.equal(isSolved(parseLevel(['>.*.*'])), true);
  assert.equal(isSolved(parseLevel(['>.*#*'])), false);
  assert.equal(isSolved(parseLevel(['>...'])), false); // кристаллов нет — нечего проходить
  assert.equal(isSolved(parseLevel(['>.\\', '..*'])), true);
  assert.equal(isSolved(parseLevel(['>./', '..*'])), false);
});

test('solve находит, какие зеркала повернуть', () => {
  const level = parseLevel(['>./', '...', '*./']);
  // Нужно: (2,0) «\» вниз, затем (2,2) «/» влево к кристаллу.
  const result = solve(level);
  assert.ok(result);
  assert.deepEqual(result.rotations, [{ x: 2, y: 0 }]);
  assert.equal(isSolved(result.level), true);
  assert.equal(result.solutionCount, 1);
  assert.ok(result.steps > 0);
  // Исходный уровень не изменился.
  assert.equal(isSolved(level), false);
});

test('solve выбирает самое короткое решение', () => {
  // Кристалл горит и без поворотов — поворачивать ничего не нужно.
  const result = solve(parseLevel(['>.\\', '/.*']));
  assert.deepEqual(result.rotations, []);
});

test('solve учитывает закреплённые зеркала', () => {
  // Закреплённое «/» уводит луч вверх, мимо кристалла внизу.
  assert.equal(solve(parseLevel(['>.Z', '..*'])), null);
  // А обычное зеркало можно повернуть.
  assert.deepEqual(solve(parseLevel(['>./', '..*'])).rotations, [{ x: 2, y: 0 }]);
});

test('solve возвращает null, если решения нет', () => {
  assert.equal(solve(parseLevel(['>.#*'])), null);
  assert.equal(solve(parseLevel(['>...'])), null);
});

test('solve справляется с зеркалом, через которое луч идёт дважды', () => {
  // Луч проходит через (2,1) два раза: сначала вниз, потом снова вверх.
  const level = parseLevel(['..*....', '>./..\\.', '.......', '..*#.*.', '../..\\.']);
  const result = solve(level);
  assert.ok(result);
  assert.equal(isSolved(result.level), true);
});

test('solve не уходит в бесконечный перебор', () => {
  assert.throws(
    () => solve(parseLevel(['>/././.', './././.', '*/././.']), { maxSteps: 3 }),
    /Слишком большой перебор/,
  );
});
