import { describe, expect, mock, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createTransport } from "../src/transports/factory";
import { HttpTransport } from "../src/transports/http";
import { StdioTransport } from "../src/transports/stdio";
import type { Config } from "../src/types/config";

describe("Transport Factory", () => {
  // Mock MCP server
  const mockMcpServer = {
    connect: mock(() => Promise.resolve()),
  } as unknown as McpServer;

  test("creates StdioTransport for stdio mode", async () => {
    const config: Config = {
      mode: "stdio",
      obsidian: {
        apiKey: "test-key",
        protocol: "http",
        host: "localhost",
        port: 27123,
      },
    };

    const transport = await createTransport(config, mockMcpServer);
    expect(transport).toBeInstanceOf(StdioTransport);
  });

  test("creates HttpTransport for http mode", async () => {
    const config: Config = {
      mode: "http",
      port: 4000,
      obsidian: {
        apiKey: "test-key",
        protocol: "http",
        host: "localhost",
        port: 27123,
      },
    };

    const transport = await createTransport(config, mockMcpServer);
    expect(transport).toBeInstanceOf(HttpTransport);
  });

  test("creates HttpTransport for https mode", async () => {
    const config: Config = {
      mode: "https",
      port: 4443,
      certPath: "/tmp/cert.pem",
      keyPath: "/tmp/key.pem",
      obsidian: {
        apiKey: "test-key",
        protocol: "http",
        host: "localhost",
        port: 27123,
      },
    };

    const transport = await createTransport(config, mockMcpServer);
    expect(transport).toBeInstanceOf(HttpTransport);
  });
});

describe("Transport Implementations", () => {
  const mockMcpServer = {
    connect: mock(() => Promise.resolve()),
  } as unknown as McpServer;

  describe("StdioTransport", () => {
    test("can be instantiated", () => {
      const transport = new StdioTransport(mockMcpServer);
      expect(transport).toBeDefined();
    });

    test("implements Transport interface", () => {
      const transport = new StdioTransport(mockMcpServer);
      expect(typeof transport.start).toBe("function");
      expect(typeof transport.stop).toBe("function");
    });
  });

  describe("HttpTransport", () => {
    test("can be instantiated for http mode", () => {
      const config: Config = {
        mode: "http",
        port: 4000,
        obsidian: {
          apiKey: "test-key",
          protocol: "http",
          host: "localhost",
          port: 27123,
        },
      };

      const transport = new HttpTransport(mockMcpServer, config);
      expect(transport).toBeDefined();
    });

    test("can be instantiated for https mode", () => {
      const config: Config = {
        mode: "https",
        port: 4443,
        certPath: "/tmp/cert.pem",
        keyPath: "/tmp/key.pem",
        obsidian: {
          apiKey: "test-key",
          protocol: "http",
          host: "localhost",
          port: 27123,
        },
      };

      const transport = new HttpTransport(mockMcpServer, config);
      expect(transport).toBeDefined();
    });

    test("implements Transport interface", () => {
      const config: Config = {
        mode: "http",
        port: 4000,
        obsidian: {
          apiKey: "test-key",
          protocol: "http",
          host: "localhost",
          port: 27123,
        },
      };

      const transport = new HttpTransport(mockMcpServer, config);
      expect(typeof transport.start).toBe("function");
      expect(typeof transport.stop).toBe("function");
    });
  });
});
