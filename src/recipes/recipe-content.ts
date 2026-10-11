import sanitizeHtml from 'sanitize-html';

export function sanitizeSummary(value: string): string {
  return sanitizeHtml(value ?? '', {
    allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href', 'rel'] },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}

export function safeHttpUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function safeImage(value?: string | null): string | undefined {
  if (value && /^[a-zA-Z0-9][\w.-]*$/.test(value)) return value;
  return safeHttpUrl(value ?? undefined);
}
