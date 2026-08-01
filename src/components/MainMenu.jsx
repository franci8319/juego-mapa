export const SCREENS = [
  { id: 'flag-to-country', label: 'Bandera → País', icon: '🏳️', color: '#4361ee' },
  { id: 'country-to-flag', label: 'País → Bandera', icon: '🚩', color: '#2b9348' },
  { id: 'map-game', label: 'Mapa', icon: '🗺️', color: '#f77f00' },
  { id: 'explore', label: 'Explorar mapa', icon: '🧭', color: '#7209b7' },
  { id: 'album', label: 'Mi álbum', icon: '📖', color: '#e63946' },
];

export default function MainMenu({ onNavigate }) {
  return (
    <nav className="main-menu">
      {SCREENS.map((screen) => (
        <button
          key={screen.id}
          type="button"
          className="menu-card"
          style={{ background: screen.color }}
          onClick={() => onNavigate(screen.id)}
        >
          <span className="menu-card__icon" aria-hidden="true">
            {screen.icon}
          </span>
          <span className="menu-card__label">{screen.label}</span>
        </button>
      ))}
    </nav>
  );
}
