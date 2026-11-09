import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveCursor, swipeDirection, keyAction, cellFromPoint, fitCellSize, cellAt } from '../../src/ui/grid.js';

const level = { width: 3, height: 2, cells: ['a', 'b', 'c', 'd', 'e', 'f'].map((type) => ({ type })) };

test('курсор двигается и не выходит за поле', () => {
  assert.deepEqual(moveCursor({ x: 0, y: 0 }, 'left', level), { x: 0, y: 0 });
  assert.deepEqual(moveCursor({ x: 0, y: 0 }, 'right', level), { x: 1, y: 0 });
  assert.deepEqual(moveCursor({ x: 2, y: 1 }, 'down', level), { x: 2, y: 1 });
  assert.deepEqual(moveCursor({ x: 1, y: 1 }, 'up', level), { x: 1, y: 0 });
});

test('свайп: направление и порог', () => {
  assert.equal(swipeDirection(5, 5), null);
  assert.equal(swipeDirection(60, 10), 'right');
  assert.equal(swipeDirection(-60, 10), 'left');
  assert.equal(swipeDirection(5, 80), 'down');
  assert.equal(swipeDirection(5, -80), 'up');
});

test('клавиши', () => {
  assert.deepEqual(keyAction('ArrowUp'), { move: 'up' });
  assert.deepEqual(keyAction(' '), { rotate: true });
  assert.deepEqual(keyAction('Enter'), { rotate: true });
  assert.equal(keyAction('x'), null);
});

test('клетка по точке и размер клетки', () => {
  assert.deepEqual(cellFromPoint(70, 10, level, 50), { x: 1, y: 0 });
  assert.equal(cellFromPoint(200, 10, level, 50), null);
  assert.equal(fitCellSize(level, 300, 1000), 96);
  assert.equal(fitCellSize(level, 150, 1000), 50);
});

test('cellAt работает с плоским массивом и с рядами', () => {
  assert.equal(cellAt(level, 1, 1).type, 'e');
  const rows = { width: 2, height: 2, cells: [[{ type: 'a' }, { type: 'b' }], [{ type: 'c' }, { type: 'd' }]] };
  assert.equal(cellAt(rows, 1, 1).type, 'd');
  assert.equal(cellAt(rows, 2, 0), null);
});
