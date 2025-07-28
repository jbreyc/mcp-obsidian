#!/usr/bin/env node

/**
 * Comprehensive test runner for dependency updates
 * Runs all tests in sequence and provides detailed reporting
 */

import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  async runCommand(command, args = [], description = "") {
    console.log(`\n🔄 ${description || `${command} ${args.join(" ")}`}`);
    console.log("─".repeat(50));

    const start = performance.now();

    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: "inherit",
      });

      process.on("close", (code) => {
        const duration = performance.now() - start;

        if (code === 0) {
          console.log(`✅ Completed in ${Math.round(duration)}ms`);
          this.results.push({
            test: description || `${command} ${args.join(" ")}`,
            success: true,
            duration: Math.round(duration),
          });
          resolve();
        } else {
          console.log(
            `❌ Failed with exit code ${code} (${Math.round(duration)}ms)`,
          );
          this.results.push({
            test: description || `${command} ${args.join(" ")}`,
            success: false,
            duration: Math.round(duration),
            exitCode: code,
          });
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on("error", (error) => {
        const duration = performance.now() - start;
        console.log(`❌ Error: ${error.message} (${Math.round(duration)}ms)`);
        this.results.push({
          test: description || `${command} ${args.join(" ")}`,
          success: false,
          duration: Math.round(duration),
          error: error.message,
        });
        reject(error);
      });
    });
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running ${testName}...`);
    console.log("=".repeat(60));

    const start = performance.now();

    try {
      await testFn();
      const duration = performance.now() - start;
      console.log(
        `\n✅ ${testName} completed successfully (${Math.round(duration)}ms)`,
      );
      this.results.push({
        test: testName,
        success: true,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - start;
      console.log(
        `\n❌ ${testName} failed: ${error.message} (${Math.round(duration)}ms)`,
      );
      this.results.push({
        test: testName,
        success: false,
        duration: Math.round(duration),
        error: error.message,
      });
      throw error;
    }
  }

  printSummary() {
    const totalDuration = performance.now() - this.startTime;

    console.log("\n🎯 TEST SUMMARY");
    console.log("=".repeat(60));

    const successful = this.results.filter((r) => r.success).length;
    const total = this.results.length;

    console.log(`📊 Results: ${successful}/${total} tests passed`);
    console.log(`⏱️  Total time: ${Math.round(totalDuration)}ms`);
    console.log(`📈 Success rate: ${((successful / total) * 100).toFixed(1)}%`);

    if (successful === total) {
      console.log("\n🎉 All tests passed! Dependencies are working correctly.");
    } else {
      console.log("\n❌ Some tests failed:");
      this.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(
            `  - ${r.test}: ${r.error || `Exit code ${r.exitCode}`} (${r.duration}ms)`,
          );
        });
    }

    console.log("\n📋 Detailed Results:");
    this.results.forEach((r) => {
      const status = r.success ? "✅" : "❌";
      console.log(`  ${status} ${r.test} (${r.duration}ms)`);
    });
  }
}

async function main() {
  console.log("🚀 MCP Obsidian - Post-Update Test Suite");
  console.log("==========================================");
  console.log("Testing all functionality after dependency updates\n");

  const runner = new TestRunner();

  let testFailed = false;

  try {
    // Test 1: Check for updates
    await runner.runTest("Dependency Update Check", async () => {
      await runner.runCommand(
        "node",
        ["check-updates.js"],
        "Checking for dependency updates",
      );
    });

    // Test 2: Clean install
    await runner.runTest("Clean Install", async () => {
      await runner.runCommand("bun", ["install"], "Installing dependencies");
    });

    // Test 3: Build verification
    await runner.runTest("Build Verification", async () => {
      await runner.runCommand(
        "node",
        ["test-build.js"],
        "Running build verification",
      );
    });

    // Test 4: Direct API test (if Obsidian is running)
    await runner.runTest("Obsidian API Test", async () => {
      await runner.runCommand(
        "node",
        ["test-api.js"],
        "Testing Obsidian Local REST API",
      );
    });

    // Test 5: MCP Server test (most comprehensive)
    await runner.runTest("MCP Server Test", async () => {
      await runner.runCommand(
        "node",
        ["test-mcp-server.js"],
        "Testing MCP server functionality",
      );
    });
  } catch (error) {
    console.log(`\n⚠️  Test suite stopped early due to: ${error.message}`);
    testFailed = true;
  } finally {
    runner.printSummary();

    const allPassed = runner.results.every((r) => r.success);
    // Exit with error if tests failed or if there was an exception
    process.exit(allPassed && !testFailed ? 0 : 1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test suite interrupted by user");
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ Test runner crashed:", error);
  process.exit(1);
});
