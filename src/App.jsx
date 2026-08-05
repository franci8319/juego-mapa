import { useState } from 'react';
import Album from './components/Album.jsx';
import CountryToFlag from './components/CountryToFlag.jsx';
import ExploreMap from './components/ExploreMap.jsx';
import FlagToCountry from './components/FlagToCountry.jsx';
import MainMenu from './components/MainMenu.jsx';
import MapGame from './components/MapGame.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');
  // Portal target so MapGame can render its speaker button in this same top
  // row as the back button, instead of in its own row above the map — that
  // frees up vertical space for the map on small screens.
  const [headerActions, setHeaderActions] = useState(null);

  return (
    <main>
      <h1>Banderas del Mundial</h1>
      {screen !== 'menu' && (
        <div className="top-bar">
          <button type="button" onClick={() => setScreen('menu')}>
            ◀ Menú
          </button>
          <div className="header-actions" ref={setHeaderActions} />
        </div>
      )}
      {screen === 'menu' && <MainMenu onNavigate={setScreen} />}
      {screen === 'flag-to-country' && <FlagToCountry />}
      {screen === 'country-to-flag' && <CountryToFlag />}
      {screen === 'map-game' && <MapGame headerActions={headerActions} />}
      {screen === 'explore' && <ExploreMap />}
      {screen === 'album' && <Album />}
      <footer className="app-footer">Países y banderas, para mi hijo Alejandro</footer>
    </main>
  );
}
