export function parseEmail(raw: unknown) {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

export function parseToken(raw: unknown, minLength = 16) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length < minLength) return null;
  return value;
}

export function parseShoppingText(raw: unknown, min = 1, max = 120) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length < min || value.length > max) return null;
  return value;
}
