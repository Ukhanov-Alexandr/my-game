// «Уровень дня»: по дате получаем уровень, одинаковый у всех игроков.
// Цепочка такая: дата (YYYY-MM-DD, по UTC) → сид → генератор случайных чисел → уровень.

import { hashString, createRng } from './random.js';
import { generateLevel } from './generator.js';

// Если поменять алгоритм генерации, увеличьте версию — тогда у всех сменятся
// уровни одновременно, а старые даты не будут «наполовину» другими.
const GENERATOR_VERSION = 'mirrors-v1';
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Сегодняшняя дата по UTC в виде 'YYYY-MM-DD'.
 * UTC нужен, чтобы день сменялся у всех в один момент, независимо от часового пояса.
 * @param {Date} [now]
 */
export function todayUTC(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Проверяет, что строка — настоящая дата вида 'YYYY-MM-DD'.
 * @param {string} dateString
 */
export function isValidDate(dateString) {
  if (typeof dateString !== 'string') return false;
  const match = DATE_PATTERN.exec(dateString);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Сид (32-битное число) для даты. */
export function dateToSeed(dateString) {
  assertDate(dateString);
  return hashString(`${GENERATOR_VERSION}:${dateString}`);
}

/**
 * Уровень дня вместе с правильным ответом (пригодится для подсказок и тестов).
 * @param {string} [dateString] дата 'YYYY-MM-DD'; по умолчанию — сегодня по UTC
 * @returns {{ level: object, solution: {x:number,y:number,mirror:string}[] }}
 */
export function getDailyPuzzle(dateString = todayUTC()) {
  return generateLevel(createRng(dateToSeed(dateString)));
}

/**
 * Уровень дня: { width, height, cells }.
 * @param {string} [dateString] дата 'YYYY-MM-DD'; по умолчанию — сегодня по UTC
 */
export function getDailyLevel(dateString = todayUTC()) {
  return getDailyPuzzle(dateString).level;
}

function assertDate(dateString) {
  if (!isValidDate(dateString)) {
    throw new RangeError(`Ожидается дата в формате YYYY-MM-DD, получено: ${String(dateString)}`);
  }
}
