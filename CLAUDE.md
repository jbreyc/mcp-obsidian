# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MCP-Obsidian is a Model Context Protocol (MCP) server that acts as a bridge between AI assistants (like Claude) and Obsidian vaults through the Obsidian Local REST API community plugin. It enables AI assistants to read, write, search, and manipulate notes in an Obsidian vault programmatically.

## Tech Stack
- **Runtime**: Bun (fast JavaScript runtime)
- **Language**: TypeScript with strict mode enabled
- **Framework**: @modelcontextprotocol/sdk for MCP server implementation
- **Code Quality**: Biome for linting and formatting
- **Package Management**: bun with semantic versioning

## Architecture Overview

### Core Components

1. **MCP Server** (`src/index.ts`)
   - Entry point that creates an MCP server instance
   - Uses stdio transport for communication with MCP clients
   - Registers all available tools through the `registerTools` function

2. **Tool Registry** (`src/tools.ts`)
   - Defines 22 tools for interacting with Obsidian
   - Each tool is registered with validation schemas using Zod
   - Tools are grouped by functionality: active note, periodic notes, file operations, search, and commands

3. **Obsidian API Client** (`src/obsidian/index.ts`)
   - Encapsulates all HTTP communication with the Obsidian Local REST API
   - Handles authentication via Bearer token
   - Implements proper error handling and response parsing
   - Contains special logic for PATCH operations and path encoding

4. **Configuration** (`src/config.ts`)
   - Reads environment variables for API connection settings
   - Supports customizable protocol, host, and port
   - API key is required for authentication

5. **Path Helpers** (`src/obsidian/helpers.ts`)
   - `sanitizeAndEncodePath` function for proper URL encoding
   - Handles special characters and nested directories

### Tool Categories

1. **Active Note Operations** - Work with the currently focused note in Obsidian
2. **Periodic Notes** - Manage daily, weekly, monthly, quarterly, and yearly notes
3. **File Operations** - CRUD operations on arbitrary vault files
4. **Search Operations** - Dataview queries, JsonLogic queries, and simple text search
5. **Command Execution** - List and execute Obsidian commands
6. **Vault Navigation** - List files/directories and open files

## Development Commands

### Essential Scripts
```bash
# Development
bun dev              # Run with watch mode for development
bun build            # Build for production (outputs to dist/)

# Code Quality
bun lint             # Check code with Biome
bun format           # Format code with Biome

# Testing (requires Obsidian running with Local REST API plugin)
bun test:api         # Test direct API connection
bun test:api:nested  # Test API with nested paths
bun test:build       # Test build process
bun test:mcp         # Test MCP server functionality
bun test:deps        # Check for dependency updates
bun test:all         # Run comprehensive test suite

# Maintenance
bun check-updates    # Check for dependency updates
```

### Test Requirements
All tests require Obsidian to be running with the Local REST API plugin enabled and `OBSIDIAN_API_KEY` environment variable set. The comprehensive test suite (`bun test:all`) runs all tests in sequence and provides detailed reporting.

## Key Implementation Details

### Path Handling
- The `sanitizeAndEncodePath` helper ensures proper URL encoding for file paths
- Supports nested directories and special characters in filenames
- **Critical**: When testing API directly, do NOT apply additional URL encoding - the server handles this internally
- Double encoding (client + server) will cause request failures

### PATCH Operations
- PATCH operations use custom headers: `Operation`, `Target-Type`, `Target`
- Content-Type defaults to "text/markdown" for most operations
- Special handling for heading targets (strips leading # symbols via `processTarget`)
- Default target delimiter is "::" if not specified

### Error Handling and Debugging
- All API errors are caught and wrapped with meaningful messages
- Console logging for request/response debugging (visible in MCP Inspector)
- Response parsing handles both JSON and empty responses gracefully

## Development Workflow

### Local Development Setup
1. Clone repo and run `bun install`
2. Update Claude Desktop config to point to local `src/index.ts`
3. Use `bun` command instead of `bunx` for local development
4. Restart Claude Desktop after code changes

### Claude Desktop Configuration for Local Development
```json
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

### Production Configuration
```json
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

### Debugging
- Use MCP Inspector: `npx @modelcontextprotocol/inspector bun src/index.ts`
- Check console.error output for request/response details
- Test individual tools through the inspector UI
- Standard debuggers won't work with stdio transport

### Environment Variables
```bash
OBSIDIAN_API_KEY=   # Required: From Local REST API plugin settings
OBSIDIAN_PROTOCOL=  # Optional: http (default) or https
OBSIDIAN_HOST=      # Optional: Default localhost
OBSIDIAN_PORT=      # Optional: Default 27123
```

## Code Patterns and Conventions

1. **TypeScript Path Aliases**: Uses `@/` prefix for absolute imports from `src/`
2. **Async/Await Throughout**: All API operations are promise-based
3. **Zod Validation**: Input validation for all tool parameters
4. **JSON Response Format**: Most tools return JSON stringified responses
5. **Error Propagation**: Errors bubble up to MCP client for user visibility
6. **Biome Configuration**: Strict linting with some rules disabled for console.error usage

## Known Issues and Limitations

1. **PATCH Operations**: May fail with "invalid-target" or JSON parsing errors
2. **File Path Encoding**: Special characters need proper encoding via helper functions
3. **API Limitations**: Bound by what the Obsidian Local REST API supports
4. **Authentication**: Requires manual API key setup in Obsidian plugin
5. **Testing Dependencies**: All tests require running Obsidian instance

## Testing Strategy

The project uses a comprehensive test suite approach:
- **API Tests**: Direct testing of Obsidian Local REST API endpoints
- **Build Tests**: Verification that TypeScript compilation works
- **MCP Tests**: End-to-end testing of MCP server functionality
- **Dependency Tests**: Verification of dependency health

Run `bun test:all` for a complete test report with timing and success metrics.

## Related Documentation

- [Obsidian Local REST API Specs](https://coddingtonbear.github.io/obsidian-local-rest-api)
- [Model Context Protocol Docs](https://modelcontextprotocol.io)
- [Project Repository](https://github.com/jbreyc/mcp-obsidian)