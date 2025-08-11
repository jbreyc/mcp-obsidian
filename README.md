---
updated: 2025-06-20 14:39
---
# MCP server for Obsidian (TypeScript + Bun)

> A Model-Context-Protocol (MCP) server that lets Claude (or any MCP-compatible LLM) interact with your Obsidian vault through the [**Local REST API**](https://github.com/coddingtonbear/obsidian-local-rest-api) community plugin – written in **TypeScript** and runnable with **bunx**.
>
> This is an enhanced fork of [@fazer-ai/mcp-obsidian](https://github.com/fazer-ai/mcp-obsidian) with added support for HTTP/HTTPS transport modes and Docker deployment.

---

## 🛠️ Components

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

---

## 🚝 Transport Modes

This server supports three transport modes:

1. **stdio** (default) - Direct process communication for Claude Desktop
2. **HTTP** - Web server on port 4000 for development
3. **HTTPS** - Secure web server on port 4443 for production

## ⚙️ Configuration

### Obsidian REST API key

There are two ways to pass the Obsidian API key to the server:

1. **Server config (recommended)** – pass it via the `env` field in your Claude (or other client) MCP-server declaration:

```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "mcp-obsidian": {
      "command": "bun",
      "args": ["/path/to/mcp-obsidian/src/index.ts"],
      "env": {
        "OBSIDIAN_API_KEY": "your-obsidian-api-key"
      }
    }
  }
}
```

2. Alternatively, you can use an **`.env` file**. Place the key in the `.env` you created above. Note it must be placed in the working directory where the MCP server is running.


### Environment variables

You can use the `.env.example` file as reference to create your own `.env` file.

---

## 🐳 Docker Support

For production deployments, use Docker with HTTP/HTTPS transport:

```bash
# Build image
docker build -t mcp-obsidian .

# Run with docker-compose
docker compose --profile http up -d   # HTTP mode
docker compose --profile https up -d  # HTTPS mode
```

### SSL Certificates (HTTPS mode)

For HTTPS mode, generate certificates:
```bash
# Development certificates
./scripts/generate-dev-cert.sh

# Or use openssl directly
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem \
  -days 365 -nodes -subj "/CN=localhost"
```

### Docker Troubleshooting

**Connection to Obsidian fails:**
- Use `OBSIDIAN_HOST=host.docker.internal` in your `.env` file
- On Linux, you may need `OBSIDIAN_HOST=172.17.0.1`

**Port already in use:**
```bash
# Change external port
HTTP_EXTERNAL_PORT=3001 docker compose --profile http up
```

**Check container health:**
```bash
docker compose ps
curl http://localhost:4000/health     # HTTP mode
curl -k https://localhost:4443/health # HTTPS mode
```

## License

MIT – see [LICENSE](LICENSE).

## Credits

This project is a fork of [@fazer-ai/mcp-obsidian](https://github.com/fazer-ai/mcp-obsidian) by Markus Pfundstein, enhanced with HTTP/HTTPS transport modes and Docker support.
