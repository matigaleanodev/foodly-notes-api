const OPEN_CORS_ORIGIN = '*';

export function resolveCorsOrigins(
  corsOrigin = process.env.CORS_ORIGIN,
  production = process.env.NODE_ENV === 'production',
): string | string[] {
  const normalizedValue = corsOrigin?.trim();

  if (!normalizedValue || normalizedValue === OPEN_CORS_ORIGIN) {
    if (production)
      throw new Error('Production requires an explicit CORS_ORIGIN allowlist.');
    return OPEN_CORS_ORIGIN;
  }

  const origins = normalizedValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (production && (!origins.length || origins.includes('*')))
    throw new Error('Production requires an explicit CORS_ORIGIN allowlist.');
  for (const origin of origins) {
    const url = new URL(origin);
    if (
      !['http:', 'https:', 'capacitor:'].includes(url.protocol) ||
      url.host.includes('*') ||
      url.username ||
      url.password ||
      (url.pathname && url.pathname !== '/') ||
      url.search ||
      url.hash
    )
      throw new Error(
        'CORS_ORIGIN must contain exact origins without paths or credentials.',
      );
  }

  return origins.length ? origins : OPEN_CORS_ORIGIN;
}
