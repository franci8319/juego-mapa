import iso from 'i18n-iso-countries';

export function toNumericId(flagCode) {
  const alpha2 = flagCode === 'gb-eng' || flagCode === 'gb-sct' ? 'GB' : flagCode.toUpperCase();
  const numeric = iso.alpha2ToNumeric(alpha2);
  return numeric ? String(Number(numeric)) : null;
}

export function matchesGeography(flagCode, geographyId) {
  const numeric = toNumericId(flagCode);
  return numeric !== null && numeric === String(Number(geographyId));
}
