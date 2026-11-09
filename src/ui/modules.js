// Подключает модули соседних тредов; если файла ещё нет — берёт заглушку.
import * as stubs from './stubs.js';

async function load(path, pick, fallback) {
  try { return pick(await import(path)); } catch { return fallback; }
}

export async function loadModules() {
  const core = await load('../core/index.js', (m) => ({ traceBeam: m.traceBeam, rotateMirror: m.rotateMirror, isSolved: m.isSolved }), stubs.core);
  const levels = await load('../levels/index.js', (m) => m.levels ?? m.default, stubs.levels);
  const getDailyLevel = await load('../daily/index.js', (m) => m.getDailyLevel, stubs.getDailyLevel);
  const audio = await load('../audio/index.js', (m) => ({ playRotate: m.playRotate, playWin: m.playWin, setMuted: m.setMuted }), stubs.audio);
  return { core, levels, getDailyLevel, audio };
}
