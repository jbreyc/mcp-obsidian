import * as fs from "node:fs";
import type { Server } from "node:http";
import * as https from "node:https";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import type { HttpConfig, HttpsConfig } from "../types/config";
import { ConfigurationError } from "../utils/errors";
import type { Transport } from "./types";

export class HttpTransport implements Transport {
  private mcpServer: McpServer;
  private config: HttpConfig | HttpsConfig;
  private app: express.Application;
  private server: Server | null = null;
  private mcpTransport: StreamableHTTPServerTransport;

  constructor(mcpServer: McpServer, config: HttpConfig | HttpsConfig) {
    this.mcpServer = mcpServer;
    this.config = config;
    this.app = express();

    // Create MCP transport in stateless mode for HTTP requests
    this.mcpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint for Docker
    this.app.get("/health", (_req, res) => {
      res.json({
        status: "ok",
        mode: this.config.mode,
        timestamp: new Date().toISOString(),
      });
    });

    // MCP endpoint for protocol messages
    this.app.post("/mcp", express.json(), async (req, res) => {
      try {
        await this.mcpTransport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    });

    // Handle unsupported methods on /mcp
    this.app.all("/mcp", (req, res) => {
      if (req.method !== "POST") {
        res.status(405).json({ error: `Method ${req.method} not allowed` });
      }
    });

    // 404 handler for unknown routes
    this.app.use((_req, res) => {
      res.status(404).json({ error: "Not found" });
    });

    // Global error handler
    this.app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        console.error("Express error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );
  }

  async start(): Promise<void> {
    // First connect the MCP server to the transport
    await this.mcpServer.connect(this.mcpTransport);

    // Then start the HTTP/HTTPS server
    return new Promise((resolve, reject) => {
      const port = this.config.port;

      // Create server based on mode
      if (this.config.mode === "https") {
        const httpsConfig = this.config as HttpsConfig;
        let cert: string;
        let key: string;

        try {
          cert = fs.readFileSync(httpsConfig.certPath, "utf8");
          key = fs.readFileSync(httpsConfig.keyPath, "utf8");
        } catch (error) {
          const configError = new ConfigurationError(
            `Failed to read SSL certificate files: ${error instanceof Error ? error.message : String(error)}`,
            "Ensure certificate and key files exist and are readable",
          );
          reject(configError);
          return;
        }

        this.server = https.createServer({ cert, key }, this.app);
      } else {
        this.server = this.app.listen();
      }

      this.server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          const configError = new ConfigurationError(
            `Port ${port} is already in use`,
            `Choose a different port using MCP_${this.config.mode.toUpperCase()}_PORT`,
          );
          reject(configError);
        } else {
          reject(error);
        }
      });

      this.server.listen(port, () => {
        console.error(
          `MCP Server running on ${this.config.mode}://localhost:${port}`,
        );
        console.error(
          `Health check: ${this.config.mode}://localhost:${port}/health`,
        );
        console.error(
          `MCP endpoint: ${this.config.mode}://localhost:${port}/mcp`,
        );
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server?.close(() => {
          this.server = null;
          resolve();
        });
      });
    }

    // Close the MCP transport
    await this.mcpTransport.close();
  }
}
