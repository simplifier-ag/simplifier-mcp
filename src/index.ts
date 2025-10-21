#!/usr/bin/env node

/**
 * Simplifier MCP Server
 *
 * This MCP (Model Context Protocol) server enables integration with the Simplifier Low Code Platform.
 * It provides tools and capabilities for creating and managing:
 *
 * - Simplifier Connectors: Integration components that connect external systems
 * - BusinessObjects (BOs): Server-side executed JavaScript functions for business logic
 *
 * The server communicates with Simplifier's REST API to perform these operations.
 */

import { SimplifierMCPServer } from './server.js';

async function main() {
  try {
    // Import dependencies
    const { SimplifierClient } = await import('./client/simplifier-client.js');
    const { getConfig } = await import('./config.js');
    const { startErrorServer } = await import('./error-server.js');

    // Check connection to Simplifier before starting the MCP server
    const config = getConfig();
    const client = new SimplifierClient();

    console.error('Checking connection to Simplifier...');

    try {
      const pingResult = await client.ping();

      if (pingResult === false) {
        // Server responded but didn't return expected "pong" message
        console.error('Simplifier server responded with unexpected format.');
        console.error('This might not be a Simplifier instance or the API endpoint has changed.');

        await startErrorServer({
          message: 'The server at the configured URL did not respond with the expected Simplifier API format.',
          details: 'The server responded but did not return the expected "pong" message. This URL might not point to a Simplifier instance.',
          baseUrl: config.baseUrl
        });

        // Keep process alive to serve the error page
        return;
      }

      console.error('Connection to Simplifier successful!');
    } catch (error) {
      // Network error, authentication error, or other connection issue
      console.error('Failed to connect to Simplifier:', error);

      let errorMessage = 'Failed to connect to the Simplifier server.';
      let errorDetails = '';

      if (error instanceof Error) {
        errorDetails = error.message;

        // Provide more specific error messages based on the error
        if (error.message.includes('ECONNREFUSED') || error.message.includes("fetch failed")) {
          errorMessage = 'Connection refused. The Simplifier server is not running or not accessible.';
        } else if (error.message.includes('ENOTFOUND')) {
          errorMessage = 'Could not resolve hostname. Check your SIMPLIFIER_BASE_URL.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication failed. Your SimplifierToken may be invalid or expired.';
        } else if (error.message.includes('404')) {
          errorMessage = 'The host was reachable, but the ping API endpoint was not found. This means this is not a Simplifier instance.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout. The server is not responding.';
        }
      }

      await startErrorServer({
        message: errorMessage,
        details: errorDetails,
        baseUrl: config.baseUrl
      });

      // Keep process alive to serve the error page
      return;
    }

    // Connection successful, start the MCP server
    const server = new SimplifierMCPServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start Simplifier MCP Server:', error);
    process.exit(1);
  }
}

main();