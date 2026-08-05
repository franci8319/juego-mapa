import { useCallback, useEffect, useRef, useState } from 'react';
import { buildOptions, pickRandomCountry } from './quiz.js';
import { unlockCountry } from './progress.js';
import { speak } from './speech.js';

const ADVANCE_DELAY_MS = 1800;
// Safety net in case speechSynthesis never reports the narration finishing
// (unreliable on some devices/browsers) — without this, a caller that locks
// interaction on "narration finished" (Bandera→País) could stay locked
// forever.
const NARRATION_TIMEOUT_MS = 10000;

// Excludes countries already asked this session so questions don't repeat
// while there are still unasked ones — once every country in the pool has
// come up, falls back to the full pool so the game keeps going instead of
// running out of questions.
function buildQuestion(pool, askedIds) {
  const remaining = pool.filter((c) => !askedIds.includes(c.id));
  const eligiblePool = remaining.length > 0 ? remaining : pool;
  const correct = pickRandomCountry(eligiblePool);
  return { correct, options: buildOptions(pool, correct) };
}

export function useMultipleChoiceQuestion(pool, announce) {
  const [question, setQuestion] = useState(() => buildQuestion(pool, []));
  // Session-only record of which countries have already been asked, so the
  // same one doesn't come up twice in a row. Not persisted — resets every
  // time this screen is left and re-entered.
  const [askedIds, setAskedIds] = useState([]);
  const [wrongIds, setWrongIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [narratingIndex, setNarratingIndex] = useState(0);
  // Bumped on every announceQuestion() call so a stale onEachStart/onEnd
  // from a superseded narration (e.g. speak()'s internal cancel() firing
  // the PREVIOUS utterance's "end" event when replay() is tapped mid
  // narration) can't overwrite state that belongs to the current one.
  const narrationGeneration = useRef(0);
  const watchdogRef = useRef(null);

  const announceQuestion = useCallback(
    (q) => {
      const generation = ++narrationGeneration.current;
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      setNarratingIndex(0);
      speak(announce(q), {
        onEachStart: (index) => {
          if (narrationGeneration.current === generation) setNarratingIndex(index);
        },
        onEnd: () => {
          if (narrationGeneration.current === generation) setNarratingIndex(null);
        },
      });
      watchdogRef.current = setTimeout(() => {
        if (narrationGeneration.current === generation) setNarratingIndex(null);
      }, NARRATION_TIMEOUT_MS);
    },
    [announce]
  );

  // Must run BEFORE the feedback effect below: on auto-advance, `question`
  // and `feedback` are both updated in the same batched tick, and this
  // effect running first (and calling speak(), which cancels any prior
  // utterance) is what lets the feedback effect's early-return (feedback
  // is now null) avoid cutting the new announcement off. Reordering these
  // two effects would make auto-advanced questions go silent.
  useEffect(() => {
    announceQuestion(question);
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  // Must run AFTER the "announce question" effect above — see the comment
  // there for why the ordering matters.
  useEffect(() => {
    if (!feedback) return undefined;
    speak(feedback.message);
    if (!feedback.correct) return undefined;
    // askedIds is read from this render's closure rather than added to the
    // dependency array below: it only ever changes together with feedback
    // (both set in this same timeout), so the closure can't go stale
    // independently of feedback changing too — same reasoning as MapGame's
    // equivalent revealedFlags/correctCount pattern.
    const nextAsked = askedIds.includes(question.correct.id) ? askedIds : [...askedIds, question.correct.id];
    const timer = setTimeout(() => {
      setWrongIds([]);
      setFeedback(null);
      setAskedIds(nextAsked);
      setQuestion(buildQuestion(pool, nextAsked));
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
    announceQuestion(question);
  }, [question, announceQuestion]);

  return { question, wrongIds, feedback, answer, replay, narratingIndex };
}
