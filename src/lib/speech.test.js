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
});
