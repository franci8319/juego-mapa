// Unicode "regional indicator symbol" letters run from U+1F1E6 ('A') to
// U+1F1FF ('Z'), in the same order as ASCII 'a'-'z'. A flag emoji is just
// two of these placed next to each other.
const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 0x61;

export function getFlagEmoji(flagCode) {
  const alpha2 = flagCode === 'gb-eng' || flagCode === 'gb-sct' ? 'gb' : flagCode;
  return [...alpha2.toLowerCase()]
    .map((char) => String.fromCodePoint(char.codePointAt(0) + REGIONAL_INDICATOR_OFFSET))
    .join('');
}
