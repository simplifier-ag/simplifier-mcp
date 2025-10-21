import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  simplifierBaseUrl: string;
  simplifierToken?: string | undefined;
  credentialsFile?: string | undefined;
}

export function validateConfig(): Config {
  const simplifierBaseUrl = process.env.SIMPLIFIER_BASE_URL;
  if (!simplifierBaseUrl) {
    throw new Error('SIMPLIFIER_BASE_URL environment variable is required');
  }
  try {
    // Basic URL validation
    new URL(simplifierBaseUrl);
  } catch (error) {
    throw new Error('SIMPLIFIER_BASE_URL must be a valid URL');
  }

  if (!process.env.SIMPLIFIER_TOKEN && !process.env.SIMPLIFIER_CREDENTIALS_FILE) {
    throw new Error('Either variable SIMPLIFIER_TOKEN with an actual token or SIMPLIFIER_CREDENTIALS_FILE pointing to a valid credentials file must be set!');
  }

  if (process.env.SIMPLIFIER_TOKEN && process.env.SIMPLIFIER_CREDENTIALS_FILE) {
    throw new Error('Cannot set both SIMPLIFIER_TOKEN and SIMPLIFIER_CREDENTIALS_FILE. Please use only one authentication method.');
  }

  return {
    simplifierBaseUrl,
    simplifierToken: process.env.SIMPLIFIER_TOKEN,
    credentialsFile: process.env.SIMPLIFIER_CREDENTIALS_FILE
  };
}

/**
 * Returns the configuration, including just the base URL for display purposes
 */
export function getConfig(): { baseUrl: string } {
  return {
    baseUrl: config.simplifierBaseUrl
  };
}

export const config = validateConfig();
