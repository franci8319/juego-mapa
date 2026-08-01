import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { continents } from '../data/continents.js';
import { getUnlockedIds } from '../lib/progress.js';
import { matchesGeography } from '../lib/isoMap.js';
import { getCentroid, hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
import { getContinentView } from '../lib/continentView.js';
import { getFlagEmoji } from '../lib/flagEmoji.js';
import FlagIcon from './FlagIcon.jsx';

// Below this zoom level the whole world (or most of it) is visible, and
// showing all 47 flag emoji at once would be an illegible pile — flags only
// start appearing once the view is zoomed in at least this much (any single
// continent's computed zoom already clears this; only the "whole world"
// view and light pinch-outs stay below it).
const FLAG_REVEAL_ZOOM = 1.3;

const flaggableCountries = paises.filter((pais) => hasMapGeometry(pais.flagCode));

function findDatasetCountry(geographyId) {
  return paises.find((pais) => matchesGeography(pais.flagCode, geographyId));
}

export default function ExploreMap() {
  const [continent, setContinent] = useState(null); // null | 'world' | { id, label, icon, color }
  const [selected, setSelected] = useState(null);
  const [liveZoom, setLiveZoom] = useState(1);

  const zoomProps =
    continent === 'world' || !continent
      ? { zoom: 1, minZoom: 1, maxZoom: 8 }
      : { ...getContinentView(continent.id), minZoom: 1, maxZoom: 8 };

  // Syncs liveZoom to the newly-selected continent's computed zoom (or 1 for
  // "world"). onMoveEnd (in the JSX below) then keeps it live as the user
  // pinch-zooms further, which is what actually drives the progressive flag
  // reveal — zoomProps.zoom alone only reflects the *initial* framing.
  useEffect(() => {
    if (continent) setLiveZoom(zoomProps.zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continent]);

  const handleGeographyClick = (geo) => {
    const datasetCountry = findDatasetCountry(geo.id);
    if (datasetCountry) {
      setSelected({ inDataset: true, country: datasetCountry, unlocked: getUnlockedIds().includes(datasetCountry.id) });
    } else {
      setSelected({ inDataset: false, name: geo.properties.name });
    }
  };

  if (!continent) {
    return (
      <section className="game explore-map">
        <p>¿Qué continente quieres explorar?</p>
        <div className="continent-picker">
          {continents.map((c) => (
            <button
              key={c.id}
              type="button"
              className="continent-card"
              style={{ background: c.color }}
              onClick={() => setContinent(c)}
            >
              <span className="continent-card__icon" aria-hidden="true">
                {c.icon}
              </span>
              <span className="continent-card__label">{c.label}</span>
            </button>
          ))}
          <button type="button" className="continent-card" onClick={() => setContinent('world')}>
            <span className="continent-card__icon" aria-hidden="true">
              🌐
            </span>
            <span className="continent-card__label">Ver el mundo entero</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="game explore-map">
      <button
        type="button"
        onClick={() => {
          setContinent(null);
          setSelected(null);
        }}
      >
        ◀ Elegir otro continente
      </button>
      <ComposableMap>
        <ZoomableGroup {...zoomProps} onMoveEnd={({ zoom }) => setLiveZoom(zoom)}>
          <Geographies geography={worldAtlasTopology}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  data-testid={`geo-${geo.id}`}
                  onClick={() => handleGeographyClick(geo)}
                />
              ))
            }
          </Geographies>
          {liveZoom >= FLAG_REVEAL_ZOOM &&
            flaggableCountries.map((pais) => {
              const centroid = getCentroid(pais.flagCode);
              if (!centroid) return null;
              return (
                <Marker key={pais.id} coordinates={centroid}>
                  <text textAnchor="middle" dy={3} style={{ fontSize: 10, pointerEvents: 'none' }}>
                    {getFlagEmoji(pais.flagCode)}
                  </text>
                </Marker>
              );
            })}
        </ZoomableGroup>
      </ComposableMap>
      {selected && (
        <div className="explore-panel">
          {selected.inDataset ? (
            <>
              <FlagIcon code={selected.country.flagCode} label={selected.country.name} size="small" />
              <p>{selected.country.name}</p>
              <p>{selected.unlocked ? '¡Ya tienes este cromo!' : 'Todavía no lo has descubierto'}</p>
            </>
          ) : (
            <p>{selected.name}</p>
          )}
        </div>
      )}
    </section>
  );
}
