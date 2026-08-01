import { paises } from '../data/paises.js';
import { getCentroid, hasMapGeometry } from './worldAtlas.js';

const ZOOM_K = 150;
const MIN_ZOOM = 1.2;
const MAX_ZOOM = 6;
const DEFAULT_VIEW = { center: [0, 0], zoom: 1 };

export function getContinentView(continentId) {
  const centroids = paises
    .filter((pais) => pais.continent === continentId && hasMapGeometry(pais.flagCode))
    .map((pais) => getCentroid(pais.flagCode))
    .filter(Boolean);

  if (centroids.length === 0) return DEFAULT_VIEW;

  const lons = centroids.map((c) => c[0]);
  const lats = centroids.map((c) => c[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  const span = Math.max(maxLon - minLon, maxLat - minLat, 1);
  const zoom = Math.min(Math.max(ZOOM_K / span, MIN_ZOOM), MAX_ZOOM);
  return { center, zoom };
}
