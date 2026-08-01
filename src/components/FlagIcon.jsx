export default function FlagIcon({ code, label, size = 'large' }) {
  return <span role="img" aria-label={label} className={`fi fi-${code} flag-icon flag-icon--${size}`} />;
}
