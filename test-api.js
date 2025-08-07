#!/usr/bin/env node

/**
 * Direct test script for Obsidian Local REST API
 * Tests complete document lifecycle: create, read, patch, delete
 */

import { fetch } from "undici";

const API_KEY =
  "a2ad34f224f2dcd5e47df293662f72f3edc2fcb6499bb68cfc9d024ccad4d0bd";
const BASE_URL = "http://localhost:27123";
const TEST_FOLDER = "00 inbox";
const TEST_FILE = `${TEST_FOLDER}/test-document.md`;

let testsPassed = 0;
let totalTests = 0;
let deletionFailed = false;

function logTest(description) {
  totalTests++;
  console.log(`\n${totalTests}️⃣ ${description}`);
  console.log("─".repeat(50));
}

function logSuccess(message) {
  testsPassed++;
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...options.headers,
      },
    });
    return { response, error: null };
  } catch (error) {
    return { response: null, error };
  }
}

async function testAPI() {
  console.log("🔬 Testing Obsidian Local REST API");
  console.log("==================================");
  console.log(`📁 Test folder: ${TEST_FOLDER}`);
  console.log(`📄 Test file: ${TEST_FILE}\n`);

  let testFailed = false;

  try {
    // Test 1: Create test file
    logTest("Creating test document");

    const testContent = `---
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
tags: [test, api-test]
---

# Main Heading

This is a test document created by the API test suite.

## Content Section

Initial content for testing the API functionality.

## Tasks

- [ ] Task 1
- [ ] Task 2
`;

    const { response: createResponse, error: createError } = await makeRequest(
      `${BASE_URL}/vault/${TEST_FILE}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "text/markdown",
        },
        body: testContent,
      },
    );

    if (createError) {
      logError(`Network error creating file: ${createError.message}`);
      testFailed = true;
      return;
    }

    if (createResponse.ok) {
      logSuccess("Test document created successfully");
    } else {
      const errorText = await createResponse.text();
      logError(
        `Failed to create file: ${createResponse.status} ${createResponse.statusText} - ${errorText}`,
      );
      testFailed = true;
      return;
    }

    // Test 2: Read the test file
    logTest("Reading test document");

    const { response: readResponse, error: readError } = await makeRequest(
      `${BASE_URL}/vault/${TEST_FILE}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.olrapi.note+json",
        },
      },
    );

    if (readError) {
      logError(`Network error reading file: ${readError.message}`);
      testFailed = true;
      return;
    }

    if (readResponse.ok) {
      try {
        const fileData = await readResponse.json();

        // Verify content contains expected elements
        if (fileData.content?.includes("Main Heading")) {
          logSuccess("Test document read successfully");
        } else {
          logError(
            "File content verification failed - missing expected content",
          );
          console.log(
            `❌ File data content: ${JSON.stringify(fileData, null, 2)}`,
          );
          testFailed = true;
          return;
        }
      } catch (jsonError) {
        logError(`Failed to parse JSON response: ${jsonError.message}`);
        const textContent = await readResponse.text();
        console.log(`❌ Raw response: ${textContent}`);
        testFailed = true;
        return;
      }
    } else {
      const errorText = await readResponse.text();
      logError(
        `Failed to read file: ${readResponse.status} ${readResponse.statusText} - ${errorText}`,
      );
      testFailed = true;
      return;
    }

    // Test 3: Patch the file (add subsection under Main Heading)
    logTest("Patching test document (adding subsection under Main Heading)");

    const patchContent = `\n### New Subsection\n\nThis subsection was added via PATCH operation.\n\n- Added content item 1\n- Added content item 2`;

    const { response: patchResponse, error: patchError } = await makeRequest(
      `${BASE_URL}/vault/${TEST_FILE}`,
      {
        method: "PATCH",
        headers: {
          Operation: "append",
          "Target-Type": "heading",
          Target: "Main Heading",
          "Content-Type": "text/markdown",
          "Target-Delimiter": "::",
        },
        body: patchContent,
      },
    );

    if (patchError) {
      logError(`Network error patching file: ${patchError.message}`);
      testFailed = true;
      return;
    }

    if (patchResponse.ok) {
      logSuccess("Document patched successfully");
    } else {
      const errorText = await patchResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        logError(`PATCH failed: ${errorData.message} (${errorData.errorCode})`);
      } catch {
        logError(
          `PATCH failed: ${patchResponse.status} ${patchResponse.statusText} - ${errorText}`,
        );
      }
      testFailed = true;
      return;
    }

    // Test 4: Delete test file
    logTest("Deleting test document");

    const { response: deleteFileResponse, error: deleteFileError } =
      await makeRequest(`${BASE_URL}/vault/${TEST_FILE}`, {
        method: "DELETE",
      });

    if (deleteFileError) {
      logError(`Network error deleting file: ${deleteFileError.message}`);
      testFailed = true;
      deletionFailed = true;
      return;
    }

    if (deleteFileResponse.ok) {
      logSuccess("Test document deleted successfully");
    } else {
      const errorText = await deleteFileResponse.text();
      logError(
        `Failed to delete file: ${deleteFileResponse.status} ${deleteFileResponse.statusText} - ${errorText}`,
      );
      testFailed = true;
      deletionFailed = true;
      return;
    }
  } catch (error) {
    console.log(`\n❌ Unexpected error during testing: ${error.message}`);
    testFailed = true;
  }

  // Print final results
  console.log("\n📊 Test Results:");
  console.log("================");
  console.log(`✅ Passed: ${testsPassed}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - testsPassed}/${totalTests}`);
  console.log(
    `🎯 Success rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`,
  );

  if (deletionFailed) {
    console.log(`\n⚠️  MANUAL CLEANUP REQUIRED:`);
    console.log(
      `   Deletion tests failed. Please manually delete the following from your Obsidian vault:`,
    );
    console.log(`   - File: ${TEST_FILE}`);
    console.log(`   This is necessary to avoid leaving test files behind.`);
    process.exit(1);
  } else if (testFailed || testsPassed !== totalTests) {
    console.log(`\n❌ Some tests failed`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All tests passed successfully!`);
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted by user");
  if (deletionFailed) {
    console.log(`\n⚠️  MANUAL CLEANUP MAY BE REQUIRED:`);
    console.log(
      `   Please check if the test files need to be manually deleted:`,
    );
    console.log(`   - File: ${TEST_FILE}`);
  }
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Test terminated");
  if (deletionFailed) {
    console.log(`\n⚠️  MANUAL CLEANUP MAY BE REQUIRED:`);
    console.log(
      `   Please check if the test files need to be manually deleted:`,
    );
    console.log(`   - File: ${TEST_FILE}`);
  }
  process.exit(1);
});

testAPI().catch((error) => {
  console.error("❌ Test suite crashed:", error);
  if (deletionFailed) {
    console.log(`\n⚠️  MANUAL CLEANUP MAY BE REQUIRED:`);
    console.log(
      `   Please check if the test files need to be manually deleted:`,
    );
    console.log(`   - File: ${TEST_FILE}`);
  }
  process.exit(1);
});
