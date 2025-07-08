import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const ENV = {
  PORT: getEnvVar('PORT', false) || 3000,
  JWT_SECRET: getEnvVar('JWT_SECRET', false) || 'default_secret_key',
};
