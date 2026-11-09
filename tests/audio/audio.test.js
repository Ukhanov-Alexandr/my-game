import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  playRotate,
  playWin,
  setMuted,
  isMuted,
  resetAudioForTests,
} from '../../src/audio/index.js';

// Фейковый AudioContext: запоминает созданные осцилляторы, чтобы проверять звуки.
function installFakeAudioContext() {
  const created = { oscillators: [] };
  class FakeAudioParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class FakeNode {
    connect() {}
  }
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = new FakeNode();
      created.contextCount = (created.contextCount || 0) + 1;
    }
    createOscillator() {
      const osc = new FakeNode();
      osc.type = 'sine';
      osc.frequency = new FakeAudioParam();
      osc.start = () => {};
      osc.stop = () => {};
      created.oscillators.push(osc);
      return osc;
    }
    createGain() {
      const gain = new FakeNode();
      gain.gain = new FakeAudioParam();
      return gain;
    }
  }
  globalThis.AudioContext = FakeAudioContext;
  return created;
}

let created;
let originalAudioContext;

beforeEach(() => {
  originalAudioContext = globalThis.AudioContext;
  created = installFakeAudioContext();
  resetAudioForTests();
});

afterEach(() => {
  globalThis.AudioContext = originalAudioContext;
  resetAudioForTests();
});

test('звук выключен по умолчанию', () => {
  assert.equal(isMuted(), false);
});

test('setMuted меняет состояние и isMuted его возвращает', () => {
  setMuted(true);
  assert.equal(isMuted(), true);
  setMuted(false);
  assert.equal(isMuted(), false);
});

test('setMuted приводит значение к логическому типу', () => {
  setMuted(1);
  assert.equal(isMuted(), true);
  setMuted(0);
  assert.equal(isMuted(), false);
});

test('playRotate создаёт один осциллятор', () => {
  playRotate();
  assert.equal(created.oscillators.length, 1);
});

test('playWin создаёт четыре ноты', () => {
  playWin();
  assert.equal(created.oscillators.length, 4);
});

test('при выключенном звуке ничего не проигрывается', () => {
  setMuted(true);
  playRotate();
  playWin();
  assert.equal(created.oscillators.length, 0);
  assert.equal(created.contextCount, undefined);
});

test('AudioContext создаётся один раз и переиспользуется', () => {
  playRotate();
  playWin();
  playRotate();
  assert.equal(created.contextCount, 1);
});

test('без поддержки Web Audio звуки молча не работают', () => {
  globalThis.AudioContext = undefined;
  globalThis.webkitAudioContext = undefined;
  resetAudioForTests();
  assert.doesNotThrow(() => {
    playRotate();
    playWin();
  });
});
