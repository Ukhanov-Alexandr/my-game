// Чистые функции для работы с полем и вводом (без DOM — их легко тестировать).

export const DIRS = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

// Клетка по координатам. Поддерживаем и плоский массив, и массив строк.
export function cellAt(level, x, y) {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return null;
  const c = level.cells;
  return Array.isArray(c[0]) ? c[y][x] : c[y * level.width + x];
}

// Сдвиг курсора с остановкой у края поля.
export function moveCursor(cursor, dir, level) {
  const d = DIRS[dir];
  if (!d) return cursor;
  return {
    x: Math.min(level.width - 1, Math.max(0, cursor.x + d.dx)),
    y: Math.min(level.height - 1, Math.max(0, cursor.y + d.dy)),
  };
}

// Направление свайпа или null, если палец сдвинулся слишком мало (это обычный тап).
export function swipeDirection(dx, dy, minDist = 30) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < minDist) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// Клавиша -> действие.
export function keyAction(key) {
  switch (key) {
    case 'ArrowUp': case 'w': case 'W': return { move: 'up' };
    case 'ArrowDown': case 's': case 'S': return { move: 'down' };
    case 'ArrowLeft': case 'a': case 'A': return { move: 'left' };
    case 'ArrowRight': case 'd': case 'D': return { move: 'right' };
    case ' ': case 'Enter': return { rotate: true };
    case 'm': case 'M': return { toggleMute: true };
    case 'Escape': return { menu: true };
    default: return null;
  }
}

// Координаты точки на canvas -> клетка поля (или null за пределами).
export function cellFromPoint(px, py, level, cellSize) {
  const x = Math.floor(px / cellSize);
  const y = Math.floor(py / cellSize);
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return null;
  return { x, y };
}

// Размер клетки, чтобы поле влезло в доступное место.
export function fitCellSize(level, availW, availH, max = 96) {
  return Math.max(16, Math.floor(Math.min(availW / level.width, availH / level.height, max)));
}
