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
