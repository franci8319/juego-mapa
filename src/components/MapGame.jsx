import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickWeightedCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { getCentroid, hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
import { getFlagEmoji } from '../lib/flagEmoji.js';
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
// Keep ZOOM_DURATION_MS in sync with the transition duration on
// `.map-game-zoom` in src/index.css — they drive the same animation from
// two different places (React's click-lock timer and the CSS transition).
const ZOOM_DURATION_MS = 4000;
const ZOOM_START_DELAY_MS = 50; // lets the world-view frame paint before animating to the target
// Zoomed in enough that small, tightly-packed European countries are still
// big enough to tap on a phone screen (4 left several of them too small).
const TARGET_ZOOM = 6;
const WORLD_VIEW = { center: [0, 0], zoom: 1 };

function announceTarget(target) {
  return ['Encuentra este país en el mapa', target.name];
}

// Excludes countries already found this session so questions don't repeat
// while there are still unfound ones — once everything has been found,
// falls back to the full pool so the game keeps going instead of crashing
// on an empty pick.
function pickNextTarget(revealedIds, correctCount) {
  const remaining = mappableCountries.filter((pais) => !revealedIds.includes(pais.id));
  const pool = remaining.length > 0 ? remaining : mappableCountries;
  return pickWeightedCountry(pool, correctCount);
}

export default function MapGame({ headerActions } = {}) {
  const [target, setTarget] = useState(() => pickNextTarget([], 0));
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongGeoId, setWrongGeoId] = useState(null);
  const [mapView, setMapView] = useState(WORLD_VIEW);
  const [isZooming, setIsZooming] = useState(true);
  // Session-only: which countries the child has already found this visit,
  // so their flag can stay pinned on the map. Not persisted — resets every
  // time this screen is left and re-entered.
  const [revealedFlags, setRevealedFlags] = useState([]);

  // Must run BEFORE the feedback effect below: on auto-advance, `target`
  // and `feedback` are both updated in the same batched tick, and this
  // effect running first (and calling speak(), which cancels any prior
  // utterance) is what lets the feedback effect's early-return (feedback
  // is now null) avoid cutting the new announcement off. Reordering these
  // two effects would make auto-advanced questions go silent.
  useEffect(() => {
    speak(announceTarget(target));
  }, [target]);

  // Resets the map to the world view, then (after a short delay so the
  // browser paints that reset frame first) animates toward the target's
  // real centroid — the CSS transition on `.map-game-zoom` is what makes
  // this a smooth zoom rather than an instant jump. Clicks are locked for
  // the whole animation window via `isZooming`.
  useEffect(() => {
    setMapView(WORLD_VIEW);
    setIsZooming(true);
    const centroid = getCentroid(target.flagCode);
    const startZoomTimer = setTimeout(() => {
      setMapView(centroid ? { center: centroid, zoom: TARGET_ZOOM } : WORLD_VIEW);
    }, ZOOM_START_DELAY_MS);
    const unlockTimer = setTimeout(() => setIsZooming(false), ZOOM_START_DELAY_MS + ZOOM_DURATION_MS);
    return () => {
      clearTimeout(startZoomTimer);
      clearTimeout(unlockTimer);
    };
  }, [target]);

  // Must run AFTER the "announce target" effect above — see the comment
  // there for why the ordering matters.
  useEffect(() => {
    if (!feedback) return undefined;
    speak(feedback.message);
    if (!feedback.correct) return undefined;
    // correctCount and revealedFlags are read from this render's closure
    // rather than added to the dependency array below: both only ever
    // change together with feedback (all set in the same click handler /
    // this same timeout), so the closure can't go stale independently of
    // feedback changing too.
    const nextCorrectCount = correctCount + 1;
    const timer = setTimeout(() => {
      setFeedback(null);
      setWrongGeoId(null);
      setCorrectCount(nextCorrectCount);
      setTarget(pickNextTarget(revealedFlags, nextCorrectCount));
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  useEffect(() => {
    if (!wrongGeoId) return undefined;
    const timer = setTimeout(() => setWrongGeoId(null), WRONG_FLASH_MS);
    return () => clearTimeout(timer);
  }, [wrongGeoId]);

  const handleGeographyClick = useCallback(
    (geo) => {
      if (feedback?.correct || isZooming) return;
      if (matchesGeography(target.flagCode, geo.id)) {
        unlockCountry(target.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${target.name}` });
        setWrongGeoId(null);
        setRevealedFlags((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));
      } else {
        setFeedback({ correct: false, message: 'Prueba con otra' });
        setWrongGeoId(geo.id);
      }
    },
    [target, feedback, isZooming]
  );

  const replay = useCallback(() => {
    speak(announceTarget(target));
  }, [target]);

  const replayButton = (
    <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
      🔊
    </button>
  );

  return (
    <section className="game map-game">
      <FlagIcon code={target.flagCode} label={`Encuentra: ${target.name}`} size="large" />
      {/* Rendered next to the "◀ Menú" button (via a portal into App's
          header row) when available, so it doesn't take up its own row
          above the map. Falls back to rendering inline here when no portal
          target is supplied (e.g. tests rendering MapGame standalone). */}
      {headerActions ? createPortal(replayButton, headerActions) : replayButton}
      <ComposableMap>
        {/* The transition class is only applied while isZooming: it must
            drop off once the intro animation ends, or it also smears the
            child's own drag/pinch gestures afterward (every pan frame would
            animate over 4s instead of tracking the finger instantly). */}
        <ZoomableGroup
          className={isZooming ? 'map-game-zoom' : ''}
          center={mapView.center}
          zoom={mapView.zoom}
          minZoom={1}
          maxZoom={8}
        >
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
          {revealedFlags.map((id) => {
            const pais = mappableCountries.find((p) => p.id === id);
            const centroid = pais && getCentroid(pais.flagCode);
            if (!centroid) return null;
            return (
              <Marker key={id} coordinates={centroid}>
                <text textAnchor="middle" dy={3} style={{ fontSize: 10, pointerEvents: 'none' }}>
                  {getFlagEmoji(pais.flagCode)}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
