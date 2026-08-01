import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { getUnlockedIds } from '../lib/progress.js';
import { matchesGeography } from '../lib/isoMap.js';
import { worldAtlasTopology } from '../lib/worldAtlas.js';
import FlagIcon from './FlagIcon.jsx';

function findDatasetCountry(geographyId) {
  return paises.find((pais) => matchesGeography(pais.flagCode, geographyId));
}

export default function ExploreMap() {
  const [selected, setSelected] = useState(null);

  const handleGeographyClick = (geo) => {
    const datasetCountry = findDatasetCountry(geo.id);
    if (datasetCountry) {
      setSelected({ inDataset: true, country: datasetCountry, unlocked: getUnlockedIds().includes(datasetCountry.id) });
    } else {
      setSelected({ inDataset: false, name: geo.properties.name });
    }
  };

  return (
    <section className="game explore-map">
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
                />
              ))
            }
          </Geographies>
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
