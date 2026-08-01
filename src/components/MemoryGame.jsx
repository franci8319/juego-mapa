import { useState } from 'react';
import { paises } from '../data/paises.js';
import { buildDeck } from '../lib/memory.js';
import { unlockCountry } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

const PAIR_COUNT = 6;

export default function MemoryGame() {
  const [deck, setDeck] = useState(() => buildDeck(paises, PAIR_COUNT));
  const [flipped, setFlipped] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);

  const totalPairs = deck.length / 2;
  const isComplete = matchedIds.length === totalPairs;

  const handlePlayAgain = () => {
    setDeck(buildDeck(paises, PAIR_COUNT));
    setFlipped([]);
    setMatchedIds([]);
  };

  const handleFlip = (card) => {
    const isAlreadyVisible = flipped.some((f) => f.key === card.key) || matchedIds.includes(card.countryId);
    if (flipped.length === 2 || isAlreadyVisible) return;

    const nextFlipped = [...flipped, card];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [a, b] = nextFlipped;
      if (a.countryId === b.countryId) {
        unlockCountry(a.countryId);
        setTimeout(() => {
          setMatchedIds((prev) => [...prev, a.countryId]);
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  return (
    <section className="game memory-game">
      <div className="memory-grid">
        {deck.map((card) => {
          const isVisible = flipped.some((f) => f.key === card.key) || matchedIds.includes(card.countryId);
          const country = paises.find((p) => p.id === card.countryId);
          return (
            <button
              key={card.key}
              type="button"
              className={`memory-card ${isVisible ? 'flipped' : ''}`}
              onClick={() => handleFlip(card)}
              disabled={isVisible}
            >
              {isVisible ? (
                card.kind === 'flag' ? (
                  <FlagIcon code={country.flagCode} label={country.name} size="small" />
                ) : (
                  country.name
                )
              ) : (
                '?'
              )}
            </button>
          );
        })}
      </div>
      {isComplete && (
        <div className="feedback feedback--correct">
          <p>¡Los encontraste todos!</p>
          <button type="button" onClick={handlePlayAgain}>
            Jugar otra vez
          </button>
        </div>
      )}
    </section>
  );
}
