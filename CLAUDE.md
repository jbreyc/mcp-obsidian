# MCP-Obsidian Project Context for Claude Code

## Project Overview
MCP-Obsidian is a Model Context Protocol (MCP) server that acts as a bridge between AI assistants (like Claude) and Obsidian vaults through the Obsidian Local REST API community plugin. It enables AI assistants to read, write, search, and manipulate notes in an Obsidian vault programmatically.

## Tech Stack
- **Runtime**: Bun (fast JavaScript runtime)
- **Language**: TypeScript with strict mode enabled
- **Framework**: @modelcontextprotocol/sdk for MCP server implementation
- **Code Quality**: Biome for linting and formatting
- **Package Management**: npm/bun with semantic versioning

## Architecture Overview

### Core Components

1. **MCP Server** (`src/index.ts`)
   - Entry point that creates an MCP server instance
   - Uses stdio transport for communication with MCP clients
   - Registers all available tools through the `registerTools` function

2. **Tool Registry** (`src/tools.ts`)
   - Defines 26 tools for interacting with Obsidian
   - Each tool is registered with validation schemas using Zod
   - Tools are grouped by functionality: active note, periodic notes, file operations, search, and commands

3. **Obsidian API Client** (`src/obsidian/index.ts`)
   - Encapsulates all HTTP communication with the Obsidian Local REST API
   - Handles authentication via Bearer token
   - Implements proper error handling and response parsing
   - Contains special logic for PATCH operations (known issue area)

4. **Configuration** (`src/config.ts`)
   - Reads environment variables for API connection settings
   - Supports customizable protocol, host, and port
   - API key is required for authentication

### Tool Categories

1. **Active Note Operations** - Work with the currently focused note in Obsidian
2. **Periodic Notes** - Manage daily, weekly, monthly, quarterly, and yearly notes
3. **File Operations** - CRUD operations on arbitrary vault files
4. **Search Operations** - Dataview queries, JsonLogic queries, and simple text search
5. **Command Execution** - List and execute Obsidian commands
6. **Vault Navigation** - List files/directories and open files

## Available NPM Scripts

```bash
# Development
bun dev          # Run with watch mode for development
bun build        # Build for production (outputs to dist/)

# Code Quality
bun lint         # Check code with Biome
bun format       # Format code with Biome

# Testing
bun test         # Run direct API test
bun test:build   # Test build process
bun test:mcp     # Test MCP server functionality
bun test:all     # Run all tests in sequence

# Maintenance
bun check-updates # Check for dependency updates
```

## Key Implementation Details

### Path Handling
- The `sanitizeAndEncodePath` helper ensures proper URL encoding for file paths
- Supports nested directories and special characters in filenames
- **Important**: When testing API directly, do NOT apply additional URL encoding - the server handles this internally
- Double encoding (client + server) will cause request failures

### PATCH Operations Issue
- PATCH operations for updating specific parts of documents have known issues
- The server correctly sends requests but the format may not match API expectations
- Previous fixes addressed boolean-to-string conversion issues
- Error messages suggest JSON parsing problems on the API side

### Error Handling
- All API errors are caught and wrapped with meaningful messages
- Includes error codes from the Obsidian API for debugging
- Console logging for request/response debugging (visible in MCP Inspector)

### Request Headers
- Custom headers for PATCH operations: Operation, Target-Type, Target, etc.
- Content-Type defaults to "text/markdown" for most operations
- Special handling for heading targets (strips leading # symbols)

## Development Workflow

1. **Local Development**
   - Clone repo and run `bun install`
   - Update Claude Desktop config to point to local `src/index.ts`
   - Use `bun` command instead of `bunx` for local development
   - Restart Claude Desktop after code changes

2. **Debugging**
   - Use MCP Inspector: `npx @modelcontextprotocol/inspector bun src/index.ts`
   - Check console.error output for request/response details
   - Test individual tools through the inspector UI

3. **Testing**
   - Ensure Obsidian is running with Local REST API plugin enabled
   - Set OBSIDIAN_API_KEY environment variable
   - Run `bun test:all` for comprehensive testing

## Configuration Requirements

### Environment Variables
```bash
OBSIDIAN_API_KEY=   # Required: From Local REST API plugin settings
OBSIDIAN_PROTOCOL=  # Optional: http (default) or https
OBSIDIAN_HOST=      # Optional: Default localhost
OBSIDIAN_PORT=      # Optional: Default 27123
```

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "@fazer-ai/mcp-obsidian": {
      "command": "bunx",
      "args": ["@fazer-ai/mcp-obsidian@latest"],
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Important Patterns and Decisions

1. **TypeScript Path Aliases**: Uses `@/` prefix for absolute imports from `src/`
2. **Async/Await Throughout**: All API operations are promise-based
3. **Zod Validation**: Input validation for all tool parameters
4. **JSON Response Format**: Most tools return JSON stringified responses
5. **Error Propagation**: Errors bubble up to MCP client for user visibility

## Known Issues and Constraints

1. **PATCH Operations**: May fail with "invalid-target" or JSON parsing errors
2. **File Path Encoding**: Special characters need proper encoding
3. **API Limitations**: Bound by what the Obsidian Local REST API supports
4. **Authentication**: Requires manual API key setup in Obsidian

## Publishing Process

1. Update version in `package.json`
2. Create GitHub release with changelog
3. Run `bun publish` to push to npm registry
4. Package is published under `@fazer-ai/mcp-obsidian`

## Best Practices When Working on This Codebase

1. **Always test with real Obsidian instance** - Mock testing is insufficient
2. **Use MCP Inspector for debugging** - Standard debuggers won't work with stdio
3. **Maintain backward compatibility** - Many users depend on stable API
4. **Document API changes** - Update both code comments and README
5. **Test error cases** - Network failures, missing files, invalid inputs
6. **Keep console.error logs** - Essential for debugging in production

## Related Documentation

- [Obsidian Local REST API Specs](https://coddingtonbear.github.io/obsidian-local-rest-api)
- [Model Context Protocol Docs](https://modelcontextprotocol.io)
- [Project Repository](https://github.com/jbreyc/mcp-obsidian)