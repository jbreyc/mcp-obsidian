#!/usr/bin/env node

/**
 * Comprehensive test suite for the MCP Obsidian server
 * Tests document lifecycle: create, search, read, modify, delete
 */

import { spawn } from "node:child_process";

const TEST_TIMEOUT = 30000; // 30 seconds
const TEST_FOLDER = "00 inbox";
const TEST_FILE = `${TEST_FOLDER}/test-document.md`;

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
    this.testsFailed = false;
    this.deletionFailed = false;
  }

  async startServer() {
    console.log("🚀 Starting MCP Server...");

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn("bun", ["run", "src/index.ts"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          OBSIDIAN_API_KEY:
            "a2ad34f224f2dcd5e47df293662f72f3edc2fcb6499bb68cfc9d024ccad4d0bd",
          OBSIDIAN_HOST: "localhost",
          OBSIDIAN_PORT: "27123",
          OBSIDIAN_PROTOCOL: "http",
        },
      });

      this.serverProcess.stderr.on("data", (data) => {
        const message = data.toString();
        console.log("Server stderr:", message);

        if (message.includes("MCP Server on stdio")) {
          console.log("✅ Server started successfully");
          resolve();
        }
      });

      this.serverProcess.on("error", (error) => {
        console.error("❌ Failed to start server:", error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error("Server startup timeout"));
      }, 10000);
    });
  }

  async sendMCPRequest(request) {
    return new Promise((resolve, reject) => {
      let response = "";
      let timeout = null;

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        this.serverProcess.stdout.removeAllListeners("data");
      };

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Request timeout"));
      }, TEST_TIMEOUT);

      this.serverProcess.stdout.on("data", (data) => {
        response += data.toString();

        // Look for complete JSON response
        try {
          const lines = response.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.id === request.id) {
              cleanup();
              resolve(parsed);
              return;
            }
          }
        } catch (_e) {
          // Not a complete JSON yet, continue waiting
        }
      });

      // Send the request
      this.serverProcess.stdin.write(`${JSON.stringify(request)}\n`);
    });
  }

  async testTool(toolName, args = {}) {
    const requestId = Math.random().toString(36).substring(7);

    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    console.log(`🧪 Testing tool: ${toolName}`);

    try {
      const response = await this.sendMCPRequest(request);

      if (response.error) {
        console.log(`   ❌ Error: ${response.error.message}`);
        this.testResults.push({
          tool: toolName,
          success: false,
          error: response.error.message,
        });
        this.testsFailed = true;
        throw new Error(`Tool ${toolName} failed: ${response.error.message}`);
      } else {
        console.log(`   ✅ Success`);
        this.testResults.push({ tool: toolName, success: true });
      }

      return response;
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
      this.testResults.push({
        tool: toolName,
        success: false,
        error: error.message,
      });
      this.testsFailed = true;
      throw error;
    }
  }

  async runTests() {
    try {
      await this.startServer();

      console.log("\n📋 Running MCP Document Lifecycle Tests...\n");

      // Test 1: Create test file
      console.log("1️⃣ Creating test document...");
      const testContent = `---
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
tags: [test, mcp-test]
---

# Test Document

This is a test document created by the MCP test suite.

## Content Section

Initial content for testing.

## Tasks

- [ ] Task 1
- [ ] Task 2
`;

      await this.testTool("obsidian_put_file", {
        filename: TEST_FILE,
        content: testContent,
      });

      // Test 2: Search for the file
      console.log("\n2️⃣ Searching for test document...");
      const searchResult = await this.testTool("obsidian_simple_search", {
        query: "mcp-test",
        contextLength: 50,
      });

      // Verify search found our file
      if (searchResult.result?.result) {
        const results = JSON.parse(searchResult.result.result);
        const found = results.some((r) =>
          r.filename.includes("test-document.md"),
        );
        if (!found) {
          throw new Error("Search did not find the test document");
        }
        console.log("   ✅ Search verification passed");
      }

      // Test 3: Read the file
      console.log("\n3️⃣ Reading test document...");
      const readResult = await this.testTool("obsidian_get_file", {
        filename: TEST_FILE,
      });

      // Verify content
      if (readResult.result?.content?.[0]?.text) {
        const fileData = JSON.parse(readResult.result.content[0].text);
        if (!fileData.content?.includes("Test Document")) {
          throw new Error("Read file content does not match expected");
        }
        console.log("   ✅ Content verification passed");
      } else {
        throw new Error("Unexpected response format from obsidian_get_file");
      }

      // Test 4: Modify the file
      console.log("\n4️⃣ Modifying test document...");
      await this.testTool("obsidian_patch_file", {
        filename: TEST_FILE,
        operation: "append",
        targetType: "heading",
        target: "Test Document::Tasks",
        content: "\n- [ ] Task 3 (added by test)",
      });

      // Test 5: Delete the file
      console.log("\n5️⃣ Deleting test document...");
      try {
        await this.testTool("obsidian_delete_file", {
          filename: TEST_FILE,
        });
      } catch (error) {
        console.log(`   ❌ Deletion failed: ${error.message}`);
        this.deletionFailed = true;
        this.testsFailed = true;
        throw error;
      }
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      this.testsFailed = true;
    } finally {
      this.cleanup();
    }
  }

  cleanup() {
    if (this.serverProcess) {
      console.log("\n🧹 Cleaning up server process...");
      this.serverProcess.kill();
    }
  }

  printResults() {
    console.log("\n📊 Test Results:");
    console.log("================");

    const successful = this.testResults.filter((r) => r.success).length;
    const total = this.testResults.length;

    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);

    if (total - successful > 0) {
      console.log("\nFailed tests:");
      this.testResults
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.tool}: ${r.error}`));
    }

    console.log(
      `\n🎯 Success rate: ${((successful / total) * 100).toFixed(1)}%`,
    );

    if (this.deletionFailed) {
      console.log(`\n⚠️  MANUAL CLEANUP REQUIRED:`);
      console.log(
        `   Deletion test failed. Please manually delete the following from your Obsidian vault:`,
      );
      console.log(`   - File: ${TEST_FILE}`);
      console.log(`   This is necessary to avoid leaving test files behind.`);
      return 1;
    } else if (this.testsFailed || successful !== total) {
      console.log(`\n❌ Some tests failed`);
      return 1;
    } else {
      console.log(`\n🎉 All tests passed successfully!`);
      return 0;
    }
  }
}

// Run the tests
async function main() {
  console.log("🧪 MCP Obsidian Server Test Suite");
  console.log("==================================");
  console.log(`📁 Test folder: ${TEST_FOLDER}`);
  console.log(`📄 Test file: ${TEST_FILE}\n`);

  const tester = new MCPTester();
  let exitCode = 1;

  try {
    await tester.runTests();
  } finally {
    exitCode = tester.printResults();
    process.exit(exitCode);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted by user");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Test terminated");
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ Test suite crashed:", error);
  process.exit(1);
});
