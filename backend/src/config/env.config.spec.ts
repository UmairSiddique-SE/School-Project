import { parseDurationMs, validateConfig } from './env.config';

describe('validateConfig', () => {
  it('requires database and JWT configuration', () => {
    expect(() => validateConfig({})).toThrow('DATABASE_URL is missing');
  });

  it('rejects short and fallback JWT secrets', () => {
    expect(() =>
      validateConfig({ DATABASE_URL: 'postgresql://db', JWT_SECRET: 'short' }),
    ).toThrow('at least 16 characters');
    expect(() =>
      validateConfig({
        DATABASE_URL: 'postgresql://db',
        JWT_SECRET: 'development-only-secret',
      }),
    ).toThrow('must not use the development fallback');
  });

  it('accepts a valid configuration', () => {
    const config = validateConfig({
      DATABASE_URL: 'postgresql://db',
      JWT_SECRET: 'a-long-random-deployment-secret',
    });
    expect(config.JWT_EXPIRATION).toBe('15m');
    expect(config.API_PREFIX).toBe('api');
  });
});

describe('parseDurationMs', () => {
  it('parses minutes, hours and days', () => {
    expect(parseDurationMs('15m')).toBe(15 * 60_000);
    expect(parseDurationMs('12h')).toBe(12 * 3_600_000);
    expect(parseDurationMs('7d')).toBe(7 * 86_400_000);
  });

  it('falls back to seven days for invalid values', () => {
    expect(parseDurationMs('bad')).toBe(7 * 86_400_000);
  });
});
