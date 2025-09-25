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
    const server = new SimplifierMCPServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start Simplifier MCP Server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}