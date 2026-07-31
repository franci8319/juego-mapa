export default function FlagIcon({ code, label, size = 'large' }) {
  const sizeClass = size === 'small' ? 'flag-icon--small' : 'flag-icon--large';
  return <span role="img" aria-label={label} className={`fi fi-${code} flag-icon ${sizeClass}`} />;
}
