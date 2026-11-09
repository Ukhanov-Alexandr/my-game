import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyLevel,
  getDailyPuzzle,
  dateToSeed,
  isValidDate,
  todayUTC,
} from '../../src/daily/index.js';
import {
  traceBeam,
  isSolved,
  countCrystals,
  validateLevel,
  solve,
} from '../../src/core/index.js';

/** Все даты года в формате YYYY-MM-DD. */
function datesOfYear(year) {
  const dates = [];
  for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += 86_400_000) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}

function withSolution(level, solution) {
  const copy = structuredClone(level);
  for (const { x, y, mirror } of solution) copy.cells[y][x].mirror = mirror;
  return copy;
}

test('одна дата — один и тот же уровень', () => {
  assert.deepEqual(getDailyLevel('2026-11-09'), getDailyLevel('2026-11-09'));
});

test('уровень зависит только от даты, а не от предыдущих вызовов', () => {
  const first = getDailyLevel('2026-11-09');
  getDailyLevel('2030-01-01');
  getDailyLevel('2026-11-10');
  assert.deepEqual(getDailyLevel('2026-11-09'), first);
});

test('сид даты зафиксирован (если тест упал — у всех игроков сменились уровни)', () => {
  assert.equal(dateToSeed('2026-11-09'), dateToSeed('2026-11-09'));
  assert.equal(dateToSeed('2026-11-09'), 3159764986);
});

test('за год нет двух одинаковых уровней', () => {
  const seen = new Set(datesOfYear(2027).map((d) => JSON.stringify(getDailyLevel(d))));
  assert.equal(seen.size, 365);
});

test('проверка дат: принимает только настоящие YYYY-MM-DD', () => {
  assert.equal(isValidDate('2026-11-09'), true);
  assert.equal(isValidDate('2028-02-29'), true);
  for (const bad of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-1-5', '09.11.2026', '', null, 20261109]) {
    assert.equal(isValidDate(bad), false, String(bad));
    assert.throws(() => getDailyLevel(bad), RangeError);
  }
});

test('todayUTC берёт дату по UTC, а не по местному времени', () => {
  // В Москве уже 10 ноября, а по UTC ещё 9-е.
  assert.equal(todayUTC(new Date('2026-11-10T01:30:00+03:00')), '2026-11-09');
  assert.equal(todayUTC(new Date('2026-11-09T23:59:59Z')), '2026-11-09');
});

test('без аргумента выдаётся уровень на сегодня по UTC', () => {
  assert.deepEqual(getDailyLevel(), getDailyLevel(todayUTC()));
});

test('каждый день 2026–2027 годов: уровень по контракту, решаем и не решён в начале', () => {
  for (const date of [...datesOfYear(2026), ...datesOfYear(2027)]) {
    const { level, solution } = getDailyPuzzle(date);

    // Форма уровня по общему контракту и ровно один фонарь.
    assert.deepEqual(validateLevel(level), [], date);
    const emitters = level.cells.flat().filter((cell) => cell.type === 'emitter');
    assert.equal(emitters.length, 1, date);
    assert.ok(countCrystals(level) >= 3, date);

    // В начале не все кристаллы горят, а с правильными зеркалами — все.
    assert.equal(isSolved(level), false, date);
    assert.equal(isSolved(withSolution(level, solution)), true, date);
  }
});

test('решатель из ядра тоже находит решение', () => {
  for (const date of datesOfYear(2027)) {
    const result = solve(getDailyLevel(date));
    assert.ok(result, date);
    assert.ok(result.rotations.length > 0, date);
  }
});

test('в начале горит меньше кристаллов, чем нужно', () => {
  const level = getDailyLevel('2026-11-09');
  assert.ok(traceBeam(level).litCrystals.length < countCrystals(level));
});
