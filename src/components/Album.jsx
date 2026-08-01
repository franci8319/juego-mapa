import { paises } from '../data/paises.js';
import { getUnlockedIds } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

export default function Album() {
  const unlockedIds = getUnlockedIds();

  return (
    <section className="album">
      <p>
        {unlockedIds.length}/{paises.length} cromos
      </p>
      <div className="album-grid">
        {paises.map((pais) => {
          const unlocked = unlockedIds.includes(pais.id);
          return (
            <div key={pais.id} className={`album-card ${unlocked ? 'unlocked' : 'locked'}`}>
              {unlocked ? (
                <>
                  <FlagIcon code={pais.flagCode} label={pais.name} size="small" />
                  <span>{pais.name}</span>
                </>
              ) : (
                <span aria-label="Sin descubrir" className="album-card__mystery">
                  ?
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
