---
updated: 2025-06-20 14:39
---
# MCP server for Obsidian (TypeScript + Bun)

[![NPM Version](https://img.shields.io/npm/v/%40jbreyc%2Fmcp-obsidian)](https://www.npmjs.com/package/@jbreyc/mcp-obsidian)

> A Model-Context-Protocol (MCP) server that lets Claude (or any MCP-compatible LLM) interact with your Obsidian vault through the [**Local REST API**](https://github.com/coddingtonbear/obsidian-local-rest-api) community plugin – written in **TypeScript** and runnable with **bunx**.
>
> This is an enhanced fork of [@fazer-ai/mcp-obsidian](https://github.com/fazer-ai/mcp-obsidian) with added support for HTTP/HTTPS transport modes and Docker deployment.

---

## ✨ Components

### Tools

| Tool name | Description |
|-----------|-------------|
| **obsidian_status** | Returns basic details about the Obsidian Local REST API server and your authentication status |
| **obsidian_delete_active** | Deletes the note that is currently active in the Obsidian UI |
| **obsidian_get_active** | Retrieves the full content of the active note (Markdown or JSON view) |
| **obsidian_patch_active** | Inserts, replaces or prepends content in the active note relative to a heading, block reference, or front-matter field |
| **obsidian_post_active** | Appends Markdown to the end of the active note |
| **obsidian_put_active** | Replaces the entire body of the active note |
| **obsidian_get_commands** | Lists every command available in Obsidian’s command palette |
| **obsidian_execute_command** | Executes a specific Obsidian command by its ID |
| **obsidian_open_file** | Opens the given file inside Obsidian (creates it if missing); optional flag to open in a new leaf |
| **obsidian_delete_periodic** | Deletes the current daily / weekly / monthly / quarterly / yearly note for the requested period |
| **obsidian_get_periodic** | Returns the content of the current periodic note for the requested period |
| **obsidian_patch_periodic** | Inserts / replaces content in a periodic note relative to a heading, block reference, or front-matter field |
| **obsidian_post_periodic** | Appends Markdown to the periodic note (creates it if it doesn’t exist) |
| **obsidian_put_periodic** | Replaces the entire body of a periodic note |
| **obsidian_search_dataview** | Runs a Dataview-DQL query across the vault and returns matching rows |
| **obsidian_search_json_logic** | Runs a JsonLogic query against structured note metadata |
| **obsidian_simple_search** | Performs a plain-text fuzzy search with optional surrounding context |
| **obsidian_list_vault_root** | Lists all files and directories at the **root** of your vault |
| **obsidian_list_vault_directory** | Lists files and directories inside a **specific folder** of the vault |
| **obsidian_delete_file** | Deletes a specific file (or directory) in the vault |
| **obsidian_get_file** | Retrieves the content of a file in the vault (Markdown or JSON view) |
| **obsidian_patch_file** | Inserts / replaces content in an arbitrary file relative to a heading, block reference, or front-matter field |
| **obsidian_post_file** | Appends Markdown to a file (creates it if it doesn’t exist) |
| **obsidian_put_file** | Creates a new file or replaces the entire body of an existing file |

*See Obsidian's [Local REST API specifications](https://coddingtonbear.github.io/obsidian-local-rest-api) for more details.*

### Important Notes for API Clients

**Path Encoding**: When using the Local REST API directly (outside of this MCP server), do **NOT** URL-encode file paths. The server handles all necessary encoding internally. Paths should be sent as-is:

✅ **Correct**: `GET /vault/00 inbox/my document.md`  
❌ **Incorrect**: `GET /vault/00%20inbox%2Fmy%20document.md` (double encoding will cause failures)

**PATCH Operations**: There are known issues with PATCH operations that may fail with `invalid-target` errors. This is a limitation of the current REST API implementation.

---

### Example prompts

```text
# Summarize the latest “architecture call” note
# (Claude will transparently call list_files_in_vault → get_file_contents)
Get the contents of the last “architecture call” note and summarize them.

# Find all mentions of Cosmos DB
Search for all files where “Azure CosmosDb” is mentioned and explain the context briefly.

# Create a summary note
Summarize yesterday’s meeting and save it as “summaries/2025-04-24-meeting.md”. Add a short intro suitable for e-mail.
```

---

## 🚀 Transport Modes

This server supports three transport modes:

1. **stdio** (default) - Direct process communication for Claude Desktop
2. **HTTP** - Web server on port 4000 for development
3. **HTTPS** - Secure web server on port 4443 for production

### Quick Start

#### Claude Desktop (stdio mode)
```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "@jbreyc/mcp-obsidian": {
      "command": "bunx",
      "args": ["@jbreyc/mcp-obsidian@latest"],
      "env": {
        "OBSIDIAN_API_KEY": "your-obsidian-api-key"
      }
    }
  }
}
```

#### Docker Deployment (HTTP/HTTPS)
```bash
# Clone and configure
git clone https://github.com/jbreyc/mcp-obsidian
cd mcp-obsidian
cp .env.example .env
# Edit .env with your OBSIDIAN_API_KEY

# HTTP mode (development)
docker compose --profile http up --build

# HTTPS mode (production)
./scripts/generate-dev-cert.sh  # Generate certificates
docker compose --profile https up --build
```

See [Docker Deployment Guide](docs/docker-deployment.md) for detailed instructions.

## ⚙️ Configuration

### Obsidian REST API key

There are two ways to pass the Obsidian API key to the server:

1. **Server config (recommended)** – pass it via the `env` field in your Claude (or other client) MCP-server declaration:

```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "@jbreyc/mcp-obsidian": {
      "command": "bunx",
      "args": ["@jbreyc/mcp-obsidian@latest"],
      "env": {
        "OBSIDIAN_API_KEY": "your-obsidian-api-key"
      }
    }
  }
}
```

>[!NOTE]
> Use `@jbreyc/mcp-obsidian@latest` to ensure you always run the most up to date version of the server.

2. Alternatively, you can use an **`.env` file**. Place the key in the `.env` you created above. Note it must be placed in the working directory where the MCP server is running.


### Environment variables

You can use the `.env.example` file as reference to create your own `.env` file.

```bash
# Required
OBSIDIAN_API_KEY=           # From Local REST API plugin settings

# Optional (with defaults)
MCP_TRANSPORT=              # stdio (default), http, or https
OBSIDIAN_PROTOCOL=http      # http or https
OBSIDIAN_HOST=localhost     # Obsidian host
OBSIDIAN_PORT=27123         # Local REST API port

# Required for HTTP mode
MCP_HTTP_PORT=4000          # HTTP server port

# Required for HTTPS mode  
MCP_HTTPS_PORT=4443         # HTTPS server port
MCP_SSL_CERT=               # Path to certificate file
MCP_SSL_KEY=                # Path to private key file
```

---

## 🛠 Development

### Running local version on Claude Desktop

After cloning this repo, you can update Claude's config to run your local version of the server instead of pulling from npm.
This is useful for quickly testing changes before publishing.

>[!NOTE]
>Keep in mind any changes you make on the code will only take effect after restarting the Claude Desktop app.

1. Clone this repo and run `bun install` to install dependencies.
1. Update your `claude_desktop_config.json` to point to your local version of the server:

```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "@jbreyc/mcp-obsidian": {
      "command": "bun",
      "args": ["/path/to/repo/src/index.ts"],
      "env": {
        "OBSIDIAN_API_KEY": "your-obsidian-api-key"
      }
    }
  }
}
```

>[!IMPORTANT]
>Note we use `bun` instead of `bunx` here.

### Debugging

MCP servers talk over **stdio**, so normal debuggers aren’t helpful.  
Use the **[MCP Inspector](https://github.com/modelcontextprotocol/inspector)**:

```bash
npx @modelcontextprotocol/inspector bun /path/to/repo/src/index.ts
```

Open the URL it prints to step through requests (usually http://localhost:6274), inspect tool calls, and watch logs in real time.

---

## 🐳 Docker Support

For production deployments, use Docker with HTTP/HTTPS transport:

```bash
# Build image
docker build -t mcp-obsidian .

# Run with docker-compose
docker compose --profile http up   # HTTP mode
docker compose --profile https up  # HTTPS mode
```

See [Docker Deployment Guide](docs/docker-deployment.md) for complete instructions including SSL certificate setup.

## 📦 Publishing

1. Update the version in `package.json`.
1. Create GitHub release.
1. Run `npm publish`.

---

## License

MIT – see [LICENSE](LICENSE).

## Credits

This project is a fork of [@fazer-ai/mcp-obsidian](https://github.com/fazer-ai/mcp-obsidian) by Markus Pfundstein, enhanced with HTTP/HTTPS transport modes and Docker support.
