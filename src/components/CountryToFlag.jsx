import { paises } from '../data/paises.js';
import { useMultipleChoiceQuestion } from '../lib/useMultipleChoiceQuestion.js';
import AnswerFeedback from './AnswerFeedback.jsx';
import FlagIcon from './FlagIcon.jsx';

const announce = (question) => question.correct.name;

export default function CountryToFlag() {
  const { question, wrongIds, feedback, answer, replay } = useMultipleChoiceQuestion(paises, announce);

  return (
    <section className="game country-to-flag">
      <p>¿Cuál es la bandera de {question.correct.name}?</p>
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <div className="options">
        {question.options.map((option) => {
          const isWrong = wrongIds.includes(option.id);
          const isCorrectPick = Boolean(feedback?.correct) && option.id === question.correct.id;
          const className = isWrong ? 'option--wrong' : isCorrectPick ? 'option--correct' : undefined;
          return (
            <button
              key={option.id}
              type="button"
              aria-label={`Bandera de ${option.name}`}
              onClick={() => answer(option)}
              disabled={isWrong || Boolean(feedback?.correct)}
              className={className}
            >
              <FlagIcon code={option.flagCode} label={`Bandera de ${option.name}`} size="medium" />
            </button>
          );
        })}
      </div>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
