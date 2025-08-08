# MCP-server

# Universal MCP Server

A Universal MCP (Model Context Protocol) Server running on Cloudflare Workers. This server provides various tools including a calculator and a universal API caller that can be used by any MCP client.

## Features

- **Authless**: No authentication required to use the server
- **CORS-enabled**: Works with browser-based clients
- **Session Management**: Properly handles MCP sessions
- **Tools**:
  - `add`: Simple addition tool
  - `calculate`: Advanced calculator with multiple operations
  - `callApi`: Universal API caller for making HTTP requests to any endpoint
  - `system.listTools`: Lists all available tools

## Deployment

This server can be deployed to Cloudflare Workers using GitHub Actions:

1. Fork this repository
2. Add your Cloudflare API Token and Account ID as GitHub secrets:
   - `CF_API_TOKEN`: Your Cloudflare API token with Workers permissions
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
3. Push to the main branch to trigger deployment

## Local Development

### Standard Method

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Using Docker

This project can also be run in a Docker container:

```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up -d

# Stop the container
docker-compose down
```

The server will be available at `http://localhost:8787`

## Connect to Cloudflare AI Playground

You can connect to your MCP server from the Cloudflare AI Playground, which is a remote MCP client:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`remote-mcp-server-authless.<your-account>.workers.dev/sse`)
3. You can now use your MCP tools directly from the playground!

## Connect Claude Desktop to your MCP server

You can also connect to your remote MCP server from local MCP clients, by using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote). 

To connect to your MCP server from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or remote-mcp-server-authless.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and you should see the tools become available. 
# MCP-server
