import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../types/config";
import { HttpTransport } from "./http";
import { StdioTransport } from "./stdio";
import type { Transport } from "./types";

export async function createTransport(
  config: Config,
  mcpServer: McpServer,
): Promise<Transport> {
  switch (config.mode) {
    case "stdio":
      return new StdioTransport(mcpServer);

    case "http":
    case "https":
      return new HttpTransport(mcpServer, config);

    default: {
      // TypeScript should never reach here due to Config union type
      const exhaustiveCheck: never = config;
      throw new Error(`Unsupported transport mode: ${String(exhaustiveCheck)}`);
    }
  }
}
