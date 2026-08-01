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

  // Must run BEFORE the feedback effect below: on auto-advance, `question`
  // and `feedback` are both updated in the same batched tick, and this
  // effect running first (and calling speak(), which cancels any prior
  // utterance) is what lets the feedback effect's early-return (feedback
  // is now null) avoid cutting the new announcement off. Reordering these
  // two effects would make auto-advanced questions go silent.
  useEffect(() => {
    speak(announce(question));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  // Must run AFTER the "announce question" effect above — see the comment
  // there for why the ordering matters.
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
