import { useState } from 'react';
import Album from './components/Album.jsx';
import MainMenu from './components/MainMenu.jsx';

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
      {screen === 'flag-to-country' && <p>Bandera → País (próximamente)</p>}
      {screen === 'country-to-flag' && <p>País → Bandera (próximamente)</p>}
      {screen === 'map-game' && <p>Mapa (próximamente)</p>}
      {screen === 'memory' && <p>Memory (próximamente)</p>}
      {screen === 'explore' && <p>Explorar mapa (próximamente)</p>}
      {screen === 'album' && <Album />}
    </main>
  );
}
