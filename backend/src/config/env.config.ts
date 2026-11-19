export interface EnvironmentVariables {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
  PORT: number;
  API_PREFIX: string;
  NODE_ENV: string;
}

export function validateConfig(config: Record<string, unknown>): EnvironmentVariables {
  const errors: string[] = [];

  const requiredKeys = ['DATABASE_URL', 'JWT_SECRET'];
  requiredKeys.forEach((key) => {
    if (!config[key]) {
      errors.push(`${key} is missing in the environment configurations`);
    }
  });

  const jwtSecret = String(config.JWT_SECRET || '');
  if (jwtSecret && jwtSecret.length < 16) {
    errors.push('JWT_SECRET must be at least 16 characters');
  }
  if (jwtSecret.includes('development-only-secret')) {
    errors.push('JWT_SECRET must not use the development fallback value');
  }

  if (errors.length > 0) {
    throw new Error(`\n=== CONFIG VALIDATION ERROR ===\n${errors.join('\n')}\n==============================`);
  }

  return {
    DATABASE_URL: config.DATABASE_URL as string,
    JWT_SECRET: config.JWT_SECRET as string,
    JWT_EXPIRATION: (config.JWT_EXPIRATION as string) || '15m',
    JWT_REFRESH_EXPIRATION: (config.JWT_REFRESH_EXPIRATION as string) || '7d',
    PORT: config.PORT ? parseInt(config.PORT as string, 10) : 3000,
    API_PREFIX: (config.API_PREFIX as string) || 'api',
    NODE_ENV: (config.NODE_ENV as string) || 'development',
  };
}

/** Parses short duration strings such as `15m`, `12h`, or `7d` into milliseconds. */
export function parseDurationMs(value: string | undefined, fallback = '7d'): number {
  const match = String(value || fallback)
    .trim()
    .match(/^(\d+)\s*([mhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return amount * multiplier;
}
