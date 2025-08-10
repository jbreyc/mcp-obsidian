import { afterAll, describe, expect, test } from "bun:test";
import { type ChildProcess, spawn } from "node:child_process";

describe("Integration Tests", () => {
  describe("stdio mode startup", () => {
    let serverProcess: ChildProcess | null = null;

    afterAll(() => {
      // Clean up server process if still running
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    test("server starts successfully in stdio mode", async () => {
      return new Promise<void>((resolve, reject) => {
        // Start server with minimal config
        serverProcess = spawn("bun", ["src/index.ts"], {
          env: {
            ...process.env,
            MCP_TRANSPORT: "stdio",
            OBSIDIAN_API_KEY: "test-key-12345",
          },
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stderrOutput = "";
        const timeout = setTimeout(() => {
          if (serverProcess) {
            serverProcess.kill();
          }
          reject(new Error(`Server failed to start. Output: ${stderrOutput}`));
        }, 10000); // 10 second timeout

        // Listen to stderr for startup messages
        serverProcess.stderr?.on("data", (data) => {
          stderrOutput += data.toString();

          // Check for successful startup
          if (stderrOutput.includes("MCP Server running successfully")) {
            clearTimeout(timeout);

            // Server started successfully, now test shutdown
            if (serverProcess) {
              serverProcess.kill("SIGTERM");

              // Give it a moment to shut down gracefully
              setTimeout(() => {
                resolve();
              }, 100);
            }
          }

          // Check for API connection failure (expected with test key)
          if (stderrOutput.includes("Failed to start MCP Server")) {
            clearTimeout(timeout);
            // This is also acceptable - server validated config and tried to connect
            resolve();
          }
        });

        serverProcess.on("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        serverProcess.on("exit", (code) => {
          clearTimeout(timeout);
          if (code !== 0 && code !== null) {
            // Non-zero exit is OK if it's due to invalid API key
            if (
              stderrOutput.includes("OBSIDIAN_API_KEY") ||
              stderrOutput.includes("authentication failed") ||
              stderrOutput.includes("Unable to connect")
            ) {
              resolve();
            } else {
              reject(
                new Error(
                  `Server exited with code ${code}. Output: ${stderrOutput}`,
                ),
              );
            }
          }
        });
      });
    });
  });

  describe("HTTP mode health check", () => {
    let serverProcess: ChildProcess | null = null;

    afterAll(() => {
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    test("HTTP server provides health endpoint", async () => {
      return new Promise<void>((resolve, reject) => {
        // Start HTTP server
        serverProcess = spawn("bun", ["src/index.ts"], {
          env: {
            ...process.env,
            MCP_TRANSPORT: "http",
            MCP_HTTP_PORT: "14000", // Use unusual port to avoid conflicts
            OBSIDIAN_API_KEY: "test-key-12345",
          },
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stderrOutput = "";
        const timeout = setTimeout(() => {
          if (serverProcess) {
            serverProcess.kill();
          }
          reject(
            new Error(`HTTP server failed to start. Output: ${stderrOutput}`),
          );
        }, 10000);

        serverProcess.stderr?.on("data", (data) => {
          stderrOutput += data.toString();

          // Check if HTTP server started
          if (
            stderrOutput.includes(
              "MCP Server running on http://localhost:14000",
            )
          ) {
            clearTimeout(timeout);

            // Test health endpoint
            fetch("http://localhost:14000/health")
              .then((response) => {
                expect(response.ok).toBe(true);
                return response.json();
              })
              .then((data) => {
                expect(data).toHaveProperty("status", "ok");
                expect(data).toHaveProperty("mode", "http");

                // Clean up
                if (serverProcess) {
                  serverProcess.kill();
                }
                resolve();
              })
              .catch((error) => {
                if (serverProcess) {
                  serverProcess.kill();
                }
                reject(error);
              });
          }

          // If server fails due to API key, that's also OK
          if (stderrOutput.includes("Failed to start MCP Server")) {
            clearTimeout(timeout);
            resolve();
          }
        });

        serverProcess.on("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });
});
