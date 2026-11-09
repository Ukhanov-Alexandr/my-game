// Проверка всех готовых уровней: запуск — `node --test` из корня проекта.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { levels, getLevel } from '../../src/levels/index.js';
import { validateLevel, isSolved, solve, levelToText, getCell } from '../../src/core/index.js';

test('уровней не меньше десяти, номера идут по порядку', () => {
  assert.ok(levels.length >= 10, `уровней всего ${levels.length}`);
  levels.forEach((level, i) => assert.equal(level.id, i + 1));
  assert.equal(getLevel(1), levels[0]);
  assert.equal(getLevel(999), null);
});

test('у всех уровней разные названия и разные карты', () => {
  const names = new Set(levels.map((l) => l.name));
  const maps = new Set(levels.map((l) => levelToText(l).join('\n')));
  assert.equal(names.size, levels.length);
  assert.equal(maps.size, levels.length);
});

for (const level of levels) {
  test(`уровень ${level.id} «${level.name}»: правильный, решаемый, не решён с начала`, () => {
    assert.ok(level.name, 'нужно название');
    assert.deepEqual(validateLevel(level), []);
    assert.ok(level.width <= 10 && level.height <= 10, 'поле должно помещаться на экране телефона');

    assert.equal(isSolved(level), false, 'уровень не должен быть решён с самого начала');

    const solution = solve(level);
    assert.ok(solution, 'у уровня должно быть решение');
    assert.equal(isSolved(solution.level), true);
    assert.ok(solution.rotations.length >= 1);
    assert.equal(solution.solutionCount, 1, 'у ручного уровня должно быть ровно одно решение');

    for (const { x, y } of solution.rotations) {
      const cell = getCell(level, x, y);
      assert.equal(cell.type, 'mirror');
      assert.ok(!cell.locked, 'решение не должно трогать закреплённые зеркала');
    }
  });
}

test('последний уровень сложнее первого', () => {
  const first = solve(levels[0]);
  const last = solve(levels[levels.length - 1]);
  assert.ok(last.rotations.length > first.rotations.length);
  assert.ok(last.steps > first.steps);
});
