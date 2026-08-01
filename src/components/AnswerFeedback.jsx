export default function AnswerFeedback({ correct, message }) {
  return (
    <div className={correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'}>
      <span className="feedback__icon" aria-hidden="true">
        {correct ? '✓' : '✗'}
      </span>
      <p>{message}</p>
    </div>
  );
}
