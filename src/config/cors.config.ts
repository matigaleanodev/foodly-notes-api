const OPEN_CORS_ORIGIN = '*';

export function resolveCorsOrigins(
  corsOrigin = process.env.CORS_ORIGIN,
): string | string[] {
  const normalizedValue = corsOrigin?.trim();

  if (!normalizedValue || normalizedValue === OPEN_CORS_ORIGIN) {
    return OPEN_CORS_ORIGIN;
  }

  const origins = normalizedValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length ? origins : OPEN_CORS_ORIGIN;
}
