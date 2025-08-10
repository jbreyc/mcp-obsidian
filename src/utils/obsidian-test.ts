import { Obsidian } from "../obsidian";
import type { ObsidianConfig } from "../types/config";
import { ConfigurationError } from "./errors";

/**
 * Tests connectivity to the Obsidian Local REST API with multiple safe operations
 * @param config Obsidian configuration including API key, host, and port
 * @throws ConfigurationError if connection fails with helpful error messages
 */
export async function testObsidianConnection(
  config: ObsidianConfig,
): Promise<void> {
  const obsidian = new Obsidian({
    apiKey: config.apiKey,
    protocol: config.protocol,
    host: config.host,
    port: config.port,
  });

  try {
    // Test connectivity with status endpoint
    console.error("Testing Obsidian API connectivity...");
    const status = await obsidian.status();

    if (!status.authenticated) {
      throw new ConfigurationError(
        "Obsidian API authentication failed",
        "Check that your OBSIDIAN_API_KEY is correct",
      );
    }

    console.error(
      `✓ Connected to Obsidian ${status.versions.obsidian} (plugin v${status.versions.self})`,
    );
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }

    // Network or API errors
    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("fetch failed")
      ) {
        throw new ConfigurationError(
          `Cannot connect to Obsidian Local REST API at ${config.host}:${config.port}`,
          "Ensure Obsidian is running with Local REST API plugin enabled and accessible",
        );
      }

      if (error.message.includes("401") || error.message.includes("403")) {
        throw new ConfigurationError(
          "Obsidian API authentication failed",
          "Check that your OBSIDIAN_API_KEY is correct in the Local REST API plugin settings",
        );
      }

      if (error.message.includes("404")) {
        throw new ConfigurationError(
          "Obsidian Local REST API plugin not found",
          "Ensure the Local REST API plugin is installed and enabled in Obsidian",
        );
      }

      // Generic error with the actual error message
      throw new ConfigurationError(
        `Obsidian API test failed: ${error.message}`,
        "Check Obsidian Local REST API plugin status and configuration",
      );
    }

    // Unknown error type
    throw new ConfigurationError(
      `Obsidian API test failed: ${String(error)}`,
      "Check Obsidian Local REST API plugin status and configuration",
    );
  }
}
