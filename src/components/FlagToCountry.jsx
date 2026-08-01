import { useCallback, useState } from 'react';
import { paises } from '../data/paises.js';
import { buildOptions, pickRandomCountry } from '../lib/quiz.js';
import { unlockCountry } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

function nextQuestion() {
  const correct = pickRandomCountry(paises);
  return { correct, options: buildOptions(paises, correct) };
}

export default function FlagToCountry() {
  const [question, setQuestion] = useState(nextQuestion);
  const [feedback, setFeedback] = useState(null);

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
    <section className="game flag-to-country">
      <FlagIcon code={question.correct.flagCode} label="Bandera a adivinar" size="large" />
      <div className="options">
        {question.options.map((option) => (
          <button key={option.id} type="button" onClick={() => handleAnswer(option)} disabled={Boolean(feedback)}>
            {option.name}
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
