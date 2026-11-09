import { loadModules } from './modules.js';
import { moveCursor, swipeDirection, keyAction, cellFromPoint, fitCellSize } from './grid.js';
import { draw } from './render.js';

const $ = (id) => document.getElementById(id);
const canvas = $('board');
const ctx = canvas.getContext('2d');

let mods, level, cursor, cs, moves, muted = false;
let solved = false;

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function show(screen) {
  $('menu').hidden = screen !== 'menu';
  $('game').hidden = screen !== 'game';
}

function layout() {
  if (!level) return;
  const wrap = $('board-wrap');
  cs = fitCellSize(level, wrap.clientWidth, wrap.clientHeight || window.innerHeight * 0.6);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = level.width * cs * dpr;
  canvas.height = level.height * cs * dpr;
  canvas.style.width = `${level.width * cs}px`;
  canvas.style.height = `${level.height * cs}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function render() {
  const beam = mods.core.traceBeam(level);
  solved = mods.core.isSolved(level);
  draw(ctx, level, beam, cursor, cs, solved);
  $('status').textContent = solved ? `Готово! Ходов: ${moves}` : `Ходов: ${moves} · кристаллы: ${beam.litCrystals.length}`;
  $('win').hidden = !solved;
}

function startLevel(lvl, title) {
  level = lvl; cursor = { x: 0, y: 0 }; moves = 0; solved = false;
  $('title').textContent = title;
  show('game');
  layout();
}

function rotateAt(x, y) {
  if (solved) return;
  const next = mods.core.rotateMirror(level, x, y);
  if (next === level) return;
  level = next; moves++;
  mods.audio.playRotate();
  const wasSolved = solved;
  render();
  if (solved && !wasSolved) mods.audio.playWin();
}

function buildMenu() {
  const list = $('levels');
  list.innerHTML = '';
  mods.levels.forEach((lvl, i) => {
    const b = document.createElement('button');
    b.textContent = i + 1;
    b.setAttribute('aria-label', `Уровень ${i + 1}`);
    b.onclick = () => startLevel(lvl, `Уровень ${i + 1}`);
    list.appendChild(b);
  });
  $('daily').onclick = () => startLevel(mods.getDailyLevel(todayString()), `Уровень дня · ${todayString()}`);
}

function toggleMute() {
  muted = !muted;
  mods.audio.setMuted(muted);
  $('mute').textContent = muted ? '🔇' : '🔊';
}

document.addEventListener('keydown', (e) => {
  if ($('game').hidden) return;
  const a = keyAction(e.key);
  if (!a) return;
  e.preventDefault();
  if (a.move) { cursor = moveCursor(cursor, a.move, level); render(); }
  else if (a.rotate) rotateAt(cursor.x, cursor.y);
  else if (a.toggleMute) toggleMute();
  else if (a.menu) show('menu');
});

// Тап — повернуть зеркало, свайп — подвинуть курсор.
let touch = null;
canvas.addEventListener('pointerdown', (e) => { touch = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!touch) return;
  const dir = swipeDirection(e.clientX - touch.x, e.clientY - touch.y);
  if (dir) { cursor = moveCursor(cursor, dir, level); render(); }
  else {
    const r = canvas.getBoundingClientRect();
    const cell = cellFromPoint(e.clientX - r.left, e.clientY - r.top, level, cs);
    if (cell) { cursor = cell; rotateAt(cell.x, cell.y); }
  }
  touch = null;
});
canvas.addEventListener('pointercancel', () => { touch = null; });

$('back').onclick = () => show('menu');
$('mute').onclick = toggleMute;
$('restart').onclick = () => startLevel(level, $('title').textContent);
window.addEventListener('resize', layout);

mods = await loadModules();
buildMenu();
show('menu');
