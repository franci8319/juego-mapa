import { useState } from 'react';
import Album from './components/Album.jsx';
import CountryToFlag from './components/CountryToFlag.jsx';
import ExploreMap from './components/ExploreMap.jsx';
import FlagToCountry from './components/FlagToCountry.jsx';
import MainMenu from './components/MainMenu.jsx';
import MapGame from './components/MapGame.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');

  return (
    <main>
      <h1>Banderas del Mundial</h1>
      {screen !== 'menu' && (
        <button type="button" onClick={() => setScreen('menu')}>
          ◀ Menú
        </button>
      )}
      {screen === 'menu' && <MainMenu onNavigate={setScreen} />}
      {screen === 'flag-to-country' && <FlagToCountry />}
      {screen === 'country-to-flag' && <CountryToFlag />}
      {screen === 'map-game' && <MapGame />}
      {screen === 'explore' && <ExploreMap />}
      {screen === 'album' && <Album />}
    </main>
  );
}
