import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  simplifierBaseUrl: string;
  simplifierToken?: string | undefined;
  apiToken?: string | undefined;
  credentialsFile?: string | undefined;
  skipConnectionTest: boolean;
  httpRequestLogFile?: string | undefined;
}

// Config without sensitive data
export interface DisplayConfig {
  baseUrl: string;
  skipConnectionTest: boolean;
  httpRequestLogFile?: string | undefined;
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

  const authMethodCount = [
    process.env.SIMPLIFIER_TOKEN,
    process.env.SIMPLIFIER_APITOKEN,
    process.env.SIMPLIFIER_CREDENTIALS_FILE,
  ].filter(Boolean).length;

  if (authMethodCount === 0) {
    throw new Error('Either variable SIMPLIFIER_TOKEN with an actual token, SIMPLIFIER_APITOKEN with a personal access token or SIMPLIFIER_CREDENTIALS_FILE pointing to a valid credentials file must be set!');
  }

  if (authMethodCount > 1) {
    throw new Error('Only one of SIMPLIFIER_TOKEN, SIMPLIFIER_APITOKEN and SIMPLIFIER_CREDENTIALS_FILE may be set. Please use only one authentication method.');
  }

  return {
    simplifierBaseUrl,
    simplifierToken: process.env.SIMPLIFIER_TOKEN,
    apiToken: process.env.SIMPLIFIER_APITOKEN,
    credentialsFile: process.env.SIMPLIFIER_CREDENTIALS_FILE,
    skipConnectionTest: process.env.SIMPLIFIER_SKIP_CONNECTION_TEST ? process.env.SIMPLIFIER_SKIP_CONNECTION_TEST !== "false" : false,
    httpRequestLogFile: process.env.HTTP_REQUEST_LOG_FILE,
  };
}

/**
 * Returns the configuration, including just the base URL for display purposes
 */
export function getConfig(): DisplayConfig {
  return {
    baseUrl: config.simplifierBaseUrl,
    skipConnectionTest: config.skipConnectionTest,
    httpRequestLogFile: config.httpRequestLogFile,
  };
}

export const config = validateConfig();
