import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "@/tools";
import { name, version } from "../package.json";
import { validateConfig } from "./config";
import { createTransport } from "./transports/factory";
import type { Transport } from "./transports/types";
import { logErrorAndExit } from "./utils/errors";
import { testObsidianConnection } from "./utils/obsidian-test";

// Global transport reference for graceful shutdown
let transport: Transport | null = null;

async function main() {
  try {
    // Step 1: Validate configuration
    console.error("🔧 Validating configuration...");
    const config = validateConfig();
    console.error(`✓ Configuration validated for ${config.mode} mode`);

    // Step 2: Test Obsidian connectivity
    await testObsidianConnection(config.obsidian);

    // Step 3: Create MCP server instance
    console.error("🚀 Initializing MCP server...");
    const server = new McpServer(
      { name, version },
      {
        instructions:
          "This is a MCP server for Obsidian. It is a simple server that can be used to run commands and get responses from the client running Local REST API community plugin.",
      },
    );

    // Step 4: Register all tools
    registerTools(server, config);
    console.error("✓ Registered all MCP tools");

    // Step 5: Create and start appropriate transport
    transport = await createTransport(config, server);
    await transport.start();

    console.error(`✅ ${name}@${version} MCP Server running successfully`);
  } catch (error) {
    logErrorAndExit(error as Error);
  }
}

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  console.error("📡 Received SIGTERM, shutting down gracefully...");
  if (transport) {
    await transport.stop();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.error("📡 Received SIGINT, shutting down gracefully...");
  if (transport) {
    await transport.stop();
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, _promise) => {
  console.error("❌ Unhandled promise rejection:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ Fatal error in main():", error);
  process.exit(1);
});
