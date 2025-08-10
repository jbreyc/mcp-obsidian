import * as fs from "node:fs";
import type {
  Config,
  HttpConfig,
  HttpsConfig,
  StdioConfig,
  TransportMode,
} from "./types/config";
import { ConfigurationError } from "./utils/errors";

function validateTransportMode(): TransportMode {
  // Default to stdio for backward compatibility and Claude Desktop
  const mode = process.env.MCP_TRANSPORT || "stdio";

  if (!["stdio", "http", "https"].includes(mode)) {
    throw new ConfigurationError(
      `Invalid MCP_TRANSPORT: ${mode}`,
      "Set MCP_TRANSPORT to: stdio, http, or https",
    );
  }

  return mode as TransportMode;
}

function validateObsidianConfig() {
  const apiKey = process.env.OBSIDIAN_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError(
      "OBSIDIAN_API_KEY is required",
      "Get API key from Obsidian Local REST API plugin settings",
    );
  }

  const protocol = (process.env.OBSIDIAN_PROTOCOL || "http") as
    | "http"
    | "https";
  if (!["http", "https"].includes(protocol)) {
    throw new ConfigurationError(
      `Invalid OBSIDIAN_PROTOCOL: ${protocol}`,
      "Set OBSIDIAN_PROTOCOL to: http or https",
    );
  }

  const host = process.env.OBSIDIAN_HOST || "localhost";
  const port = Number(process.env.OBSIDIAN_PORT) || 27123;

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new ConfigurationError(
      `Invalid OBSIDIAN_PORT: ${process.env.OBSIDIAN_PORT}`,
      "Set OBSIDIAN_PORT to a valid port number (1-65535)",
    );
  }

  return {
    apiKey,
    protocol,
    host,
    port,
  };
}

function validateHttpConfig(): HttpConfig {
  const port = Number(process.env.MCP_HTTP_PORT);

  if (!process.env.MCP_HTTP_PORT || Number.isNaN(port)) {
    throw new ConfigurationError(
      "MCP_HTTP_PORT is required for http mode",
      "Set MCP_HTTP_PORT to a valid port number (e.g., 4000)",
    );
  }

  if (port < 1 || port > 65535) {
    throw new ConfigurationError(
      `Invalid MCP_HTTP_PORT: ${port}`,
      "Set MCP_HTTP_PORT to a valid port number (1-65535)",
    );
  }

  return {
    mode: "http",
    port,
    obsidian: validateObsidianConfig(),
  };
}

function validateHttpsConfig(): HttpsConfig {
  const port = Number(process.env.MCP_HTTPS_PORT);

  if (!process.env.MCP_HTTPS_PORT || Number.isNaN(port)) {
    throw new ConfigurationError(
      "MCP_HTTPS_PORT is required for https mode",
      "Set MCP_HTTPS_PORT to a valid port number (e.g., 4443)",
    );
  }

  if (port < 1 || port > 65535) {
    throw new ConfigurationError(
      `Invalid MCP_HTTPS_PORT: ${port}`,
      "Set MCP_HTTPS_PORT to a valid port number (1-65535)",
    );
  }

  const certPath = process.env.MCP_SSL_CERT;
  const keyPath = process.env.MCP_SSL_KEY;

  if (!certPath || !keyPath) {
    throw new ConfigurationError(
      "MCP_SSL_CERT and MCP_SSL_KEY are required for https mode",
      "Set MCP_SSL_CERT and MCP_SSL_KEY to valid certificate file paths",
    );
  }

  if (!fs.existsSync(certPath)) {
    throw new ConfigurationError(
      `SSL certificate file not found: ${certPath}`,
      "Ensure the certificate file exists or update MCP_SSL_CERT path",
    );
  }

  if (!fs.existsSync(keyPath)) {
    throw new ConfigurationError(
      `SSL private key file not found: ${keyPath}`,
      "Ensure the private key file exists or update MCP_SSL_KEY path",
    );
  }

  return {
    mode: "https",
    port,
    certPath,
    keyPath,
    obsidian: validateObsidianConfig(),
  };
}

function validateStdioConfig(): StdioConfig {
  return {
    mode: "stdio",
    obsidian: validateObsidianConfig(),
  };
}

export function validateConfig(): Config {
  const mode = validateTransportMode();

  switch (mode) {
    case "stdio":
      return validateStdioConfig();
    case "http":
      return validateHttpConfig();
    case "https":
      return validateHttpsConfig();
    default:
      // TypeScript should never reach here, but just in case
      throw new ConfigurationError(
        `Unsupported transport mode: ${mode}`,
        "Use stdio, http, or https",
      );
  }
}
