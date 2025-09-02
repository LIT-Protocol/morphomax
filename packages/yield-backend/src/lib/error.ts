export function normalizeError(value: unknown): Error {
  if (value instanceof Error) return value;

  const msg = (() => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  })();

  return new Error(msg, { cause: value });
}
