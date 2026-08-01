export function speak(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const texts = Array.isArray(text) ? text : [text];
  for (const line of texts) {
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  }
}
