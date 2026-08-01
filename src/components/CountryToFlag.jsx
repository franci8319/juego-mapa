import { useCallback, useEffect, useState } from 'react';
import { paises } from '../data/paises.js';
import { buildOptions, pickRandomCountry } from '../lib/quiz.js';
import { unlockCountry } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

function nextQuestion() {
  const correct = pickRandomCountry(paises);
  return { correct, options: buildOptions(paises, correct) };
}

export default function CountryToFlag() {
  const [question, setQuestion] = useState(nextQuestion);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.correct.name);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  }, [question]);

  const handleAnswer = useCallback(
    (option) => {
      if (feedback) return;
      if (option.id === question.correct.id) {
        unlockCountry(option.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${question.correct.name}` });
      } else {
        setFeedback({ correct: false, message: `Casi... era ${question.correct.name}` });
      }
    },
    [question, feedback]
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
    setQuestion(nextQuestion());
  }, []);

  return (
    <section className="game country-to-flag">
      <p>¿Cuál es la bandera de {question.correct.name}?</p>
      <div className="options">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={`Bandera de ${option.name}`}
            onClick={() => handleAnswer(option)}
            disabled={Boolean(feedback)}
          >
            <FlagIcon code={option.flagCode} label={`Bandera de ${option.name}`} size="large" />
          </button>
        ))}
      </div>
      {feedback && (
        <div className={feedback.correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'}>
          <p>{feedback.message}</p>
          <button type="button" onClick={handleNext}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
