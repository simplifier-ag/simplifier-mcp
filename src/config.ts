import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  simplifierBaseUrl: string;
  nodeEnv: string;
  // TODO: SimplifierToken will be added in a future story
  // The user will need to obtain a daily SimplifierToken and configure it here
  // This token has session-like behavior and needs to be refreshed daily
  // simplifierToken?: string;
}

export function validateConfig(): Config {
  const simplifierBaseUrl = process.env.SIMPLIFIER_BASE_URL;

  if (!simplifierBaseUrl) {
    throw new Error('SIMPLIFIER_BASE_URL environment variable is required');
  }

  // Basic URL validation
  try {
    new URL(simplifierBaseUrl);
  } catch (error) {
    throw new Error('SIMPLIFIER_BASE_URL must be a valid URL');
  }

  return {
    simplifierBaseUrl,
    nodeEnv: process.env.NODE_ENV || 'development',
    // TODO: Add SimplifierToken validation when implemented
    // simplifierToken: process.env.SIMPLIFIER_TOKEN,
  };
}

export const config = validateConfig();