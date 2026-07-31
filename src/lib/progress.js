const STORAGE_KEY = 'banderas-mundial-progress';

export function getUnlockedIds() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isUnlocked(id) {
  return getUnlockedIds().includes(id);
}

export function unlockCountry(id) {
  const current = getUnlockedIds();
  if (current.includes(id)) return current;
  const updated = [...current, id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
