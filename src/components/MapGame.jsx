import { useCallback, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickRandomCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
import FlagIcon from './FlagIcon.jsx';

// The bundled 110m-resolution atlas drops some small island states (e.g.
// Cabo Verde, Curazao), so only countries that actually have a clickable
// polygon on the map may be asked about here — otherwise the question
// would be unwinnable. Other game modes still use the full `paises` list.
const mappableCountries = paises.filter((pais) => hasMapGeometry(pais.flagCode));

export default function MapGame() {
  const [target, setTarget] = useState(() => pickRandomCountry(mappableCountries));
  const [feedback, setFeedback] = useState(null);

  const handleGeographyClick = useCallback(
    (geo) => {
      if (feedback) return;
      if (matchesGeography(target.flagCode, geo.id)) {
        unlockCountry(target.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${target.name}` });
      } else {
        setFeedback({ correct: false, message: `Casi... era ${target.name}` });
      }
    },
    [target, feedback]
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
    setTarget(pickRandomCountry(mappableCountries));
  }, []);

  return (
    <section className="game map-game">
      <FlagIcon code={target.flagCode} label={`Encuentra: ${target.name}`} size="large" />
      <ComposableMap>
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={worldAtlasTopology}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isMissedTarget =
                  feedback && !feedback.correct && matchesGeography(target.flagCode, geo.id);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-testid={`geo-${geo.id}`}
                    onClick={() => handleGeographyClick(geo)}
                    style={
                      isMissedTarget
                        ? { default: { fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 1 } }
                        : undefined
                    }
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
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
