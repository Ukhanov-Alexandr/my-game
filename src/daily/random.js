// Детерминированная случайность для «уровня дня».
// Math.random() не подходит: он у каждого игрока свой. Здесь всё зависит
// только от входной строки, поэтому у всех получается одна и та же последовательность.

/**
 * Превращает строку в 32-битное число (хеш FNV-1a).
 * Одинаковая строка всегда даёт одинаковое число.
 * @param {string} text
 * @returns {number} целое от 0 до 2^32 - 1
 */
export function hashString(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Генератор псевдослучайных чисел mulberry32.
 * Маленький, быстрый и одинаково работает во всех браузерах.
 * @param {number} seed сид — 32-битное целое
 */
export function createRng(seed) {
  let state = seed >>> 0;

  /** Следующее число в диапазоне [0, 1). */
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    /** Целое от min до max включительно. */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** Случайный элемент массива. */
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    /** true с вероятностью p. */
    chance(p) {
      return next() < p;
    },
    /** Новый массив с перемешанными элементами (тасование Фишера — Йетса). */
    shuffle(list) {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}
