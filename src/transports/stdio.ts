import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "./types";

export class StdioTransport implements Transport {
  private mcpServer: McpServer;
  private transport: StdioServerTransport | null = null;

  constructor(mcpServer: McpServer) {
    this.mcpServer = mcpServer;
  }

  async start(): Promise<void> {
    this.transport = new StdioServerTransport();
    await this.mcpServer.connect(this.transport);

    console.error("MCP Server running on stdio");
  }

  async stop(): Promise<void> {
    // StdioServerTransport doesn't have explicit cleanup method
    // The transport will be cleaned up when the process exits
    this.transport = null;
  }
}
