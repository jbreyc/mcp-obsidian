---
created: 2025-06-19T23:55
updated: 2025-06-20 08:46
type: documentation
tags:
  - project-context
---
# Project Context

## About MCP-Obsidian
This TypeScript project implements a Model Context Protocol (MCP) server that allows AI assistants to interact with Obsidian vaults through the Obsidian Local REST API.

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript  
- **Main dependency**: @modelcontextprotocol/sdk
- **Linting**: Biome

## Project Structure
- `src/index.ts` - Main server implementation
- `package.json` - Dependencies and scripts
- `biome.jsonc` - Linting configuration

## The PATCH Problem
The MCP server acts as a bridge between AI assistants and Obsidian's REST API. Currently, PATCH operations fail when trying to update specific parts of documents. The REST API supports these operations, but something in the translation layer isn't working correctly.

## Development Workflow
- `bun build` - Build the project
- `bun biome check --write` - Format and lint
- The built server is used by Claude through MCP

## Key Insight
The error messages (`invalid-target`, `Failed to parse JSON`) suggest the REST API is being reached but the request format is incorrect. The previous `[object Object]` issue was partially fixed by handling boolean-to-string conversion, but other issues remain.

## Your Freedom
You're the coding expert. Investigate, debug, and fix it however you see fit. The goal is clear: make PATCH operations work. How you get there is up to you.