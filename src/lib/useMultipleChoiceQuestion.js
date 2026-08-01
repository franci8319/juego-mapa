import { useCallback, useEffect, useState } from 'react';
import { buildOptions, pickRandomCountry } from './quiz.js';
import { unlockCountry } from './progress.js';
import { speak } from './speech.js';

const ADVANCE_DELAY_MS = 1800;

function buildQuestion(pool) {
  const correct = pickRandomCountry(pool);
  return { correct, options: buildOptions(pool, correct) };
}

export function useMultipleChoiceQuestion(pool, announce) {
  const [question, setQuestion] = useState(() => buildQuestion(pool));
  const [wrongIds, setWrongIds] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    speak(announce(question));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  useEffect(() => {
    if (!feedback) return undefined;
    speak(feedback.message);
    if (!feedback.correct) return undefined;
    const timer = setTimeout(() => {
      setWrongIds([]);
      setFeedback(null);
      setQuestion(buildQuestion(pool));
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  const answer = useCallback(
    (option) => {
      if (feedback?.correct || wrongIds.includes(option.id)) return;
      if (option.id === question.correct.id) {
        unlockCountry(option.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${question.correct.name}` });
      } else {
        setWrongIds((prev) => [...prev, option.id]);
        setFeedback({ correct: false, message: 'Prueba con otra' });
      }
    },
    [question, wrongIds, feedback]
  );

  const replay = useCallback(() => {
    speak(announce(question));
  }, [question, announce]);

  return { question, wrongIds, feedback, answer, replay };
}
