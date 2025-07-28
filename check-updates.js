#!/usr/bin/env node

/**
 * Dependency update checker
 * Checks for available updates to dependencies
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

console.log("🔍 Checking for dependency updates...\n");

try {
  // Read current package.json
  const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

  console.log("📦 Current Dependencies:");
  console.log("=======================");

  // Display current versions
  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageJson.peerDependencies || {}),
  };

  Object.entries(allDeps).forEach(([pkg, version]) => {
    console.log(`  ${pkg}: ${version}`);
  });

  console.log("\n🔍 Checking for updates with bun...");

  try {
    // Use bun to check for outdated packages
    const output = execSync("bun outdated", {
      encoding: "utf8",
      stdio: "pipe",
    });

    if (output.trim()) {
      console.log("\n📋 Available Updates:");
      console.log("====================");
      console.log(output);
    } else {
      console.log("✅ All dependencies are up to date!");
    }
  } catch (_error) {
    console.log("ℹ️  Could not check for updates with bun outdated");
    console.log("   This might be expected if using bun < 1.0");
  }

  // Check MCP SDK specifically
  console.log("\n🔍 Checking MCP SDK updates...");
  try {
    const mcpInfo = execSync("npm view @modelcontextprotocol/sdk version", {
      encoding: "utf8",
    }).trim();

    const currentMcp = packageJson.dependencies["@modelcontextprotocol/sdk"];
    console.log(`  Current: ${currentMcp}`);
    console.log(`  Latest:  ^${mcpInfo}`);

    if (!currentMcp.includes(mcpInfo)) {
      console.log("  📦 Update available for MCP SDK!");
    } else {
      console.log("  ✅ MCP SDK is up to date");
    }
  } catch (_error) {
    console.log("  ⚠️  Could not check MCP SDK version");
  }

  // Check Biome updates
  console.log("\n🔍 Checking Biome updates...");
  try {
    const biomeInfo = execSync("npm view @biomejs/biome version", {
      encoding: "utf8",
    }).trim();

    const currentBiome = packageJson.devDependencies["@biomejs/biome"];
    console.log(`  Current: ${currentBiome}`);
    console.log(`  Latest:  ^${biomeInfo}`);

    if (!currentBiome.includes(biomeInfo)) {
      console.log("  📦 Update available for Biome!");
    } else {
      console.log("  ✅ Biome is up to date");
    }
  } catch (_error) {
    console.log("  ⚠️  Could not check Biome version");
  }

  console.log("\n💡 To update dependencies:");
  console.log("  - Run: bun update");
  console.log("  - Or manually update package.json versions");
  console.log("  - Then run: bun install");
} catch (error) {
  console.error("❌ Error checking updates:", error.message);
  process.exit(1);
}
