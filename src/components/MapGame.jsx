import { useCallback, useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickRandomCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
import { speak } from '../lib/speech.js';
import AnswerFeedback from './AnswerFeedback.jsx';
import FlagIcon from './FlagIcon.jsx';

// The bundled 110m-resolution atlas drops some small island states (e.g.
// Cabo Verde, Curazao), so only countries that actually have a clickable
// polygon on the map may be asked about here — otherwise the question
// would be unwinnable. Other game modes still use the full `paises` list.
const mappableCountries = paises.filter((pais) => hasMapGeometry(pais.flagCode));

const ADVANCE_DELAY_MS = 1800;
const WRONG_FLASH_MS = 700;

function announceTarget(target) {
  return ['Encuentra este país en el mapa', target.name];
}

export default function MapGame() {
  const [target, setTarget] = useState(() => pickRandomCountry(mappableCountries));
  const [feedback, setFeedback] = useState(null);
  const [wrongGeoId, setWrongGeoId] = useState(null);

  // Must run BEFORE the feedback effect below: on auto-advance, `target`
  // and `feedback` are both updated in the same batched tick, and this
  // effect running first (and calling speak(), which cancels any prior
  // utterance) is what lets the feedback effect's early-return (feedback
  // is now null) avoid cutting the new announcement off. Reordering these
  // two effects would make auto-advanced questions go silent.
  useEffect(() => {
    speak(announceTarget(target));
  }, [target]);

  // Must run AFTER the "announce target" effect above — see the comment
  // there for why the ordering matters.
  useEffect(() => {
    if (!feedback) return undefined;
    speak(feedback.message);
    if (!feedback.correct) return undefined;
    const timer = setTimeout(() => {
      setFeedback(null);
      setWrongGeoId(null);
      setTarget(pickRandomCountry(mappableCountries));
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!wrongGeoId) return undefined;
    const timer = setTimeout(() => setWrongGeoId(null), WRONG_FLASH_MS);
    return () => clearTimeout(timer);
  }, [wrongGeoId]);

  const handleGeographyClick = useCallback(
    (geo) => {
      if (feedback?.correct) return;
      if (matchesGeography(target.flagCode, geo.id)) {
        unlockCountry(target.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${target.name}` });
        setWrongGeoId(null);
      } else {
        setFeedback({ correct: false, message: 'Prueba con otra' });
        setWrongGeoId(geo.id);
      }
    },
    [target, feedback]
  );

  const replay = useCallback(() => {
    speak(announceTarget(target));
  }, [target]);

  return (
    <section className="game map-game">
      <FlagIcon code={target.flagCode} label={`Encuentra: ${target.name}`} size="large" />
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <ComposableMap>
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={worldAtlasTopology}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  data-testid={`geo-${geo.id}`}
                  onClick={() => handleGeographyClick(geo)}
                  style={
                    geo.id === wrongGeoId
                      ? { default: { fill: '#d90429', stroke: '#ffffff', strokeWidth: 1 } }
                      : undefined
                  }
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
