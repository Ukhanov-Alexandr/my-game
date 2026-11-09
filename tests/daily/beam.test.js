// Тесты временной копии трассировки (src/daily/beam.js).
// Удалить вместе с ней, когда генератор перейдёт на src/core/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traceBeam, isSolved } from '../../src/daily/beam.js';

// Строим уровень из строк: > < ^ v — фонарь, / \ — зеркала, * — кристалл, # — стена.
function parse(rows) {
  const emitters = { '>': 'right', '<': 'left', '^': 'up', v: 'down' };
  const cells = rows.map((row) =>
    [...row].map((ch) => {
      if (emitters[ch]) return { type: 'emitter', dir: emitters[ch] };
      if (ch === '/' || ch === '\\') return { type: 'mirror', mirror: ch };
      if (ch === '*') return { type: 'crystal' };
      if (ch === '#') return { type: 'wall' };
      return { type: 'empty' };
    }),
  );
  return { width: rows[0].length, height: rows.length, cells };
}

test('луч идёт прямо и освещает кристалл', () => {
  const level = parse(['>.*.']);
  assert.deepEqual(traceBeam(level).litCrystals, [{ x: 2, y: 0 }]);
  assert.equal(isSolved(level), true);
});

test('стена останавливает луч', () => {
  const level = parse(['>#*']);
  assert.equal(traceBeam(level).path.length, 0);
  assert.equal(isSolved(level), false);
});

test('зеркало / поворачивает луч, идущий вправо, вверх', () => {
  const level = parse(['..*', '>./']);
  assert.equal(isSolved(level), true);
});

test('зеркало \\ поворачивает луч, идущий вправо, вниз', () => {
  const level = parse(['>.\\', '..*']);
  assert.equal(isSolved(level), true);
});

test('луч, обошедший круг и вернувшийся к фонарю, останавливается', () => {
  const level = parse(['/>\\', '\\./']);
  const { path } = traceBeam(level);
  assert.deepEqual(
    path.map(({ x, y }) => `${x},${y}`),
    ['2,0', '2,1', '1,1', '0,1', '0,0'],
  );
});
