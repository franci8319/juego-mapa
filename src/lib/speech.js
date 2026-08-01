export function speak(text, { onEachStart, onEnd } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const texts = Array.isArray(text) ? text : [text];
  texts.forEach((line, index) => {
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = 'es-ES';
    if (onEachStart) {
      utterance.onstart = () => onEachStart(index);
    }
    if (onEnd && index === texts.length - 1) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  });
}
