// Уровень и клетки: создание, проверка, копирование.
// Здесь нет ничего про экран (DOM) — только данные.
//
// Уровень: { width, height, cells }, где cells[y][x] — клетка.
// x растёт вправо, y растёт вниз, (0, 0) — левый верхний угол.
//
// Клетка:
//   { type: 'empty' }
//   { type: 'wall' }
//   { type: 'emitter', dir: 'up' | 'right' | 'down' | 'left' }   — фонарь
//   { type: 'mirror', mirror: '/' | '\\', locked?: true }        — зеркало
//   { type: 'crystal' }                                          — кристалл

export const DIRECTIONS = ['up', 'right', 'down', 'left'];

export const CELL_TYPES = ['empty', 'wall', 'emitter', 'mirror', 'crystal'];

// Символы для записи уровня текстом (удобно придумывать уровни).
//   .  пусто            #  стена            *  кристалл
//   ^ > v <  фонарь, светит вверх / вправо / вниз / влево
//   /  \     зеркало, которое можно поворачивать
//   Z  N     закреплённое зеркало: Z похоже на «/», N — на «\»
const CHAR_TO_CELL = {
  '.': { type: 'empty' },
  '#': { type: 'wall' },
  '*': { type: 'crystal' },
  '^': { type: 'emitter', dir: 'up' },
  '>': { type: 'emitter', dir: 'right' },
  v: { type: 'emitter', dir: 'down' },
  '<': { type: 'emitter', dir: 'left' },
  '/': { type: 'mirror', mirror: '/' },
  '\\': { type: 'mirror', mirror: '\\' },
  Z: { type: 'mirror', mirror: '/', locked: true },
  N: { type: 'mirror', mirror: '\\', locked: true },
};

const EMITTER_CHARS = { up: '^', right: '>', down: 'v', left: '<' };

/**
 * Превращает текстовую карту в уровень.
 * Принимает строку (строки карты через перевод строки) или массив строк.
 * Пустые строки в начале и в конце, а также пробелы по краям строк игнорируются.
 */
export function parseLevel(map) {
  const rows = (Array.isArray(map) ? map : map.split('\n'))
    .map((row) => row.trim())
    .filter((row) => row.length > 0);
  if (rows.length === 0) throw new Error('Пустая карта уровня');

  const width = rows[0].length;
  const cells = rows.map((row, y) => {
    if (row.length !== width) {
      throw new Error(`Строка ${y} длиной ${row.length}, а должна быть ${width}`);
    }
    return [...row].map((ch, x) => {
      const cell = CHAR_TO_CELL[ch];
      if (!cell) throw new Error(`Неизвестный символ «${ch}» в клетке (${x}, ${y})`);
      return { ...cell };
    });
  });
  return { width, height: rows.length, cells };
}

/** Обратное действие: уровень → массив строк карты. Удобно для отладки и тестов. */
export function levelToText(level) {
  return level.cells.map((row) =>
    row
      .map((cell) => {
        switch (cell.type) {
          case 'empty':
            return '.';
          case 'wall':
            return '#';
          case 'crystal':
            return '*';
          case 'emitter':
            return EMITTER_CHARS[cell.dir];
          case 'mirror':
            if (cell.locked) return cell.mirror === '/' ? 'Z' : 'N';
            return cell.mirror;
          default:
            return '?';
        }
      })
      .join(''),
  );
}

/** Клетка по координатам или null, если координаты за пределами поля. */
export function getCell(level, x, y) {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return null;
  return level.cells[y][x];
}

/**
 * Проверяет, что уровень устроен правильно.
 * Возвращает массив текстов ошибок; пустой массив — всё хорошо.
 */
export function validateLevel(level) {
  const errors = [];
  if (!level || typeof level !== 'object') return ['Уровень должен быть объектом'];
  const { width, height, cells } = level;
  if (!Number.isInteger(width) || width < 1) errors.push('width должен быть целым числом ≥ 1');
  if (!Number.isInteger(height) || height < 1) errors.push('height должен быть целым числом ≥ 1');
  if (!Array.isArray(cells) || cells.length !== height) {
    errors.push('cells должен быть массивом из height строк');
    return errors;
  }

  let emitters = 0;
  let crystals = 0;
  cells.forEach((row, y) => {
    if (!Array.isArray(row) || row.length !== width) {
      errors.push(`Строка ${y} должна содержать ${width} клеток`);
      return;
    }
    row.forEach((cell, x) => {
      const where = `(${x}, ${y})`;
      if (!cell || !CELL_TYPES.includes(cell.type)) {
        errors.push(`Неизвестный тип клетки ${where}`);
        return;
      }
      if (cell.type === 'emitter') {
        emitters++;
        if (!DIRECTIONS.includes(cell.dir)) errors.push(`У фонаря ${where} нет направления`);
      }
      if (cell.type === 'mirror' && cell.mirror !== '/' && cell.mirror !== '\\') {
        errors.push(`У зеркала ${where} должно быть mirror: '/' или '\\'`);
      }
      if (cell.type === 'crystal') crystals++;
    });
  });
  if (emitters === 0) errors.push('Нужен хотя бы один фонарь');
  if (crystals === 0) errors.push('Нужен хотя бы один кристалл');
  return errors;
}

/** Глубокая копия уровня: изменение копии не трогает оригинал. */
export function cloneLevel(level) {
  return { ...level, cells: level.cells.map((row) => row.map((cell) => ({ ...cell }))) };
}

/**
 * Поворачивает зеркало в клетке (x, y): «/» становится «\», и наоборот.
 * Исходный уровень не меняется — возвращается новый.
 * Если в клетке нет зеркала или оно закреплено (locked), возвращается тот же
 * самый объект level — так интерфейс может понять, что ход не состоялся.
 */
export function rotateMirror(level, x, y) {
  const cell = getCell(level, x, y);
  if (!cell || cell.type !== 'mirror' || cell.locked) return level;
  const rotated = { ...cell, mirror: cell.mirror === '/' ? '\\' : '/' };
  const cells = level.cells.map((row, rowY) =>
    rowY === y ? row.map((c, colX) => (colX === x ? rotated : c)) : row,
  );
  return { ...level, cells };
}
