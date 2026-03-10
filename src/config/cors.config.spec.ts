import { resolveCorsOrigins } from './cors.config';

describe('resolveCorsOrigins', () => {
  it('returns wildcard when config is missing', () => {
    expect(resolveCorsOrigins(undefined)).toBe('*');
  });

  it('returns wildcard when config is explicitly open', () => {
    expect(resolveCorsOrigins('*')).toBe('*');
  });

  it('returns a trimmed origin list for multiple values', () => {
    expect(
      resolveCorsOrigins('https://foodly.app, https://admin.foodly.app'),
    ).toEqual(['https://foodly.app', 'https://admin.foodly.app']);
  });

  it('falls back to wildcard when config has no valid values', () => {
    expect(resolveCorsOrigins(' , ')).toBe('*');
  });
});
