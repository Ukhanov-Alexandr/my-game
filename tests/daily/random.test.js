import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashString, createRng } from '../../src/daily/random.js';

test('хеш строки стабилен и различает строки', () => {
  assert.equal(hashString('2026-11-09'), hashString('2026-11-09'));
  assert.notEqual(hashString('2026-11-09'), hashString('2026-11-10'));
  const h = hashString('любая строка');
  assert.ok(Number.isInteger(h) && h >= 0 && h < 2 ** 32);
});

test('один сид — одна и та же последовательность', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('разные сиды дают разные последовательности', () => {
  const a = createRng(1);
  const b = createRng(2);
  const seqA = Array.from({ length: 10 }, () => a.next());
  const seqB = Array.from({ length: 10 }, () => b.next());
  assert.notDeepEqual(seqA, seqB);
});

test('next() в [0, 1), int() в границах включительно', () => {
  const rng = createRng(7);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = rng.next();
    assert.ok(v >= 0 && v < 1);
    const n = rng.int(3, 5);
    assert.ok(n >= 3 && n <= 5);
    seen.add(n);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5]);
});

test('shuffle возвращает перестановку и не меняет исходный массив', () => {
  const rng = createRng(9);
  const list = [1, 2, 3, 4, 5, 6];
  const shuffled = rng.shuffle(list);
  assert.deepEqual(list, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...shuffled].sort(), list);
});
