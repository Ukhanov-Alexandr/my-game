// Правила игры «Зеркала и луч» — всё, что нужно другим частям игры.
// Импортируйте отсюда: import { traceBeam, rotateMirror, isSolved } from './core/index.js';

export {
  DIRECTIONS,
  CELL_TYPES,
  parseLevel,
  levelToText,
  getCell,
  validateLevel,
  cloneLevel,
  rotateMirror,
} from './level.js';
export { STEP, REFLECT, traceBeam, countCrystals, isSolved } from './beam.js';
export { solve } from './solver.js';
