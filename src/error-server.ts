import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ErrorDetails {
  message: string;
  details?: string;
  baseUrl?: string;
}

/**
 * Creates and starts a temporary HTTP server to display error information
 * Opens a browser window with the error page
 * @param error Error details to display
 * @returns Promise that resolves with the server instance and port, undefined if running in docker
 */
export async function startErrorServer(error: ErrorDetails): Promise<{ server: http.Server; port: number } | undefined> {
  if(process.env.RUNNING_IN_DOCKER) {
    console.error(error)
    return;
  }
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/') {
        const html = generateErrorPage(error);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else if (req.url === '/shutdown') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Server shutting down...');
        setTimeout(() => {
          server.close();
          process.exit(1);
        }, 100);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    // Find a free port (high, unused port)
    server.listen(0, 'localhost', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to get server address'));
        return;
      }

      const port = address.port;
      const url = `http://localhost:${port}`;

      // Open browser
      openBrowser(url).catch(err => {
        console.error('Failed to open browser:', err);
        console.error(`Please open the following URL manually: ${url}`);
      });

      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

/**
 * Generates an HTML error page
 */
function generateErrorPage(error: ErrorDetails): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simplifier MCP Server - Connection Error</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Nunito, Arial, Helvetica, sans-serif;
      background: rgb(0, 153, 216);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 80em;
      width: 100%;
      padding: 40px;
    }
    .icon {
      text-align: center;
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #dc2626;
      text-align: center;
      margin-bottom: 20px;
      font-size: 28px;
    }
    .message {
      color: #374151;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .details {
      background: #f3f4f6;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #1f2937;
      word-break: break-all;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background: #fef3c7;
      border-radius: 6px;
      border-left: 4px solid #f59e0b;
    }
    .section h2 {
      color: #92400e;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .section ul {
      list-style: none;
      padding-left: 0;
    }
    .section li {
      color: #78350f;
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    .section li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #f59e0b;
    }
    .code {
      background: #1f2937;
      color: #10b981;
      padding: 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      margin: 10px 0;
      overflow-x: auto;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Simplifier MCP Server Connection Error</h1>

    <div class="message">
      ${escapeHtml(error.message)}
    </div>

    ${error.details ? `<div class="details">${escapeHtml(error.details)}</div>` : ''}

    ${error.baseUrl ? `
    <div class="section">
      <h2>Configuration</h2>
      <ul>
        <li><strong>Base URL:</strong> <a href="${escapeHtml(error.baseUrl)}">${escapeHtml(error.baseUrl)}</a></li>
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <h2>How to Fix</h2>
      <ul>
        <li>Verify your Simplifier server is running and accessible</li>
        <li>Check the SIMPLIFIER_BASE_URL environment variable, it should contain your server base address, e.g. "https://myinstance.simplifier.cloud"</li>
        <li>If using the SIMPLIFIER_TOKEN environment variable: check that it is correct and is not expired</li>
        <li>If using the SIMPLIFIER_CREDENTIALS_FILE environment variable: check the contents of the credentials file. It should look similar to this:
          <div class="code">
            {
              "user": "claude",
              "pass": "mySecretPassword"
            }
          </div>
        </li>
        <li>Verify network connectivity to the Simplifier instance</li>
      </ul>
      <a href="https://www.npmjs.com/package/@simplifierag/simplifier-mcp">For more information, visit the documentation.</a>
    </div>

    <div class="section">
      <h2>Environment Variables</h2>
      <div class="code">
        export SIMPLIFIER_BASE_URL=${process.env.SIMPLIFIER_BASE_URL}
        ${process.env.SIMPLIFIER_CREDENTIALS_FILE ? `export SIMPLIFIER_CREDENTIALS_FILE=${process.env.SIMPLIFIER_CREDENTIALS_FILE}` : "# SIMPLIFIER_CREDENTIALS_FILE is NOT set"}
        # SIMPLIFIER_TOKEN is ${process.env.SIMPLIFIER_TOKEN ? "" : "NOT "}set
      </div>
    </div>

    <div class="footer">
      Close this window after fixing the issue and restart the MCP server.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Opens a URL in the default browser (cross-platform)
 */
async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case 'darwin':
      command = `open "${url}"`;
      break;
    case 'win32':
      command = `start "" "${url}"`;
      break;
    default: // linux and others
      command = `xdg-open "${url}"`;
      break;
  }

  await execAsync(command);
}
