import { paises } from '../data/paises.js';
import { useMultipleChoiceQuestion } from '../lib/useMultipleChoiceQuestion.js';
import AnswerFeedback from './AnswerFeedback.jsx';
import FlagIcon from './FlagIcon.jsx';

const announce = (question) => [
  '¿Qué país es esta bandera?',
  ...question.options.map((option) => option.name),
];

export default function FlagToCountry() {
  const { question, wrongIds, feedback, answer, replay, narratingIndex } = useMultipleChoiceQuestion(
    paises,
    announce
  );
  const isNarrating = narratingIndex !== null;
  const highlightedOptionIndex = isNarrating ? narratingIndex - 1 : -1;

  return (
    <section className="game flag-to-country">
      <FlagIcon code={question.correct.flagCode} label="Bandera a adivinar" size="large" />
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <div className="options">
        {question.options.map((option, index) => {
          const isWrong = wrongIds.includes(option.id);
          const isCorrectPick = Boolean(feedback?.correct) && option.id === question.correct.id;
          const isBeingNarrated = index === highlightedOptionIndex;
          const className = isWrong
            ? 'option--wrong'
            : isCorrectPick
              ? 'option--correct'
              : isBeingNarrated
                ? 'option--narrating'
                : undefined;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => answer(option)}
              disabled={isWrong || Boolean(feedback?.correct) || isNarrating}
              className={className}
            >
              {option.name}
            </button>
          );
        })}
      </div>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
