// Звуки игры. Все звуки синтезируются через Web Audio API:
// никаких аудиофайлов и внешних библиотек.
//
// Браузер разрешает звук только после действия пользователя (клика, нажатия
// клавиши, касания). Поэтому AudioContext создаётся при первом вызове звука,
// а такой вызов всегда происходит из действия игрока (например, поворота зеркала).

let context = null;
let muted = false;

// Возвращает AudioContext или null, если браузер его не поддерживает.
// Глобальный объект читается при каждом вызове, чтобы его можно было подменить в тестах.
function getContext() {
  if (context) return context;
  const AudioCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtor) return null;
  context = new AudioCtor();
  return context;
}

// Проигрывает один тон с плавным затуханием громкости.
// startOffset — через сколько секунд от "сейчас" начать звук.
function playTone(ctx, { frequency, endFrequency = frequency, type = 'sine', duration, volume, startOffset = 0 }) {
  const start = ctx.currentTime + startOffset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency !== frequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  }

  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

// Короткий "щелчок" при повороте зеркала.
export function playRotate() {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  playTone(ctx, { frequency: 880, endFrequency: 440, type: 'triangle', duration: 0.08, volume: 0.25 });
}

// Мелодия из четырёх нот при победе (восходящий аккорд до до-октавы).
export function playWin() {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((frequency, index) => {
    playTone(ctx, {
      frequency,
      type: 'sine',
      duration: 0.25,
      volume: 0.2,
      startOffset: index * 0.12,
    });
  });
}

// Включает или выключает все звуки.
export function setMuted(value) {
  muted = Boolean(value);
}

// Возвращает true, если звук выключен.
export function isMuted() {
  return muted;
}

// Сбрасывает внутреннее состояние. Нужен только для тестов.
export function resetAudioForTests() {
  context = null;
  muted = false;
}
