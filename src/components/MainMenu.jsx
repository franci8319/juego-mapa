export const SCREENS = [
  { id: 'flag-to-country', label: 'Bandera → País' },
  { id: 'country-to-flag', label: 'País → Bandera' },
  { id: 'map-game', label: 'Mapa' },
  { id: 'memory', label: 'Memory' },
  { id: 'explore', label: 'Explorar mapa' },
  { id: 'album', label: 'Mi álbum' },
];

export default function MainMenu({ onNavigate }) {
  return (
    <nav className="main-menu">
      {SCREENS.map((screen) => (
        <button key={screen.id} type="button" onClick={() => onNavigate(screen.id)}>
          {screen.label}
        </button>
      ))}
    </nav>
  );
}
