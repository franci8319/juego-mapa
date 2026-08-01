import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { speak } from './speech.js';

describe('speak', () => {
  beforeEach(() => {
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
    global.SpeechSynthesisUtterance = vi.fn(function (text) {
      this.text = text;
    });
  });

  afterEach(() => {
    delete window.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
  });

  it('does nothing when speechSynthesis is unavailable', () => {
    delete window.speechSynthesis;
    expect(() => speak('Hola')).not.toThrow();
  });

  it('cancels pending speech and speaks a single string in Spanish', () => {
    speak('Hola');
    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('Hola');
    const instance = SpeechSynthesisUtterance.mock.results[0].value;
    expect(instance.lang).toBe('es-ES');
  });

  it('queues each string in an array as its own utterance, in order', () => {
    speak(['Hola', 'Mundo']);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(2);
    expect(SpeechSynthesisUtterance).toHaveBeenNthCalledWith(1, 'Hola');
    expect(SpeechSynthesisUtterance).toHaveBeenNthCalledWith(2, 'Mundo');
  });

  it('fires onEnd immediately when speechSynthesis is unavailable, without throwing', () => {
    delete window.speechSynthesis;
    const onEnd = vi.fn();
    expect(() => speak('Hola', { onEnd })).not.toThrow();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('wires onEachStart to fire with the right index when each utterance starts', () => {
    const onEachStart = vi.fn();
    speak(['Hola', 'Mundo'], { onEachStart });
    const [utteranceA, utteranceB] = SpeechSynthesisUtterance.mock.results.map((r) => r.value);
    utteranceA.onstart();
    expect(onEachStart).toHaveBeenCalledWith(0);
    utteranceB.onstart();
    expect(onEachStart).toHaveBeenCalledWith(1);
  });

  it('wires onEnd to the last utterance only, not the earlier ones', () => {
    const onEnd = vi.fn();
    speak(['Hola', 'Mundo'], { onEnd });
    const [utteranceA, utteranceB] = SpeechSynthesisUtterance.mock.results.map((r) => r.value);
    expect(utteranceA.onend).toBeUndefined();
    utteranceB.onend();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('does not require onEachStart/onEnd to be provided', () => {
    expect(() => speak(['Hola', 'Mundo'])).not.toThrow();
  });
});
