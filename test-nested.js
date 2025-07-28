#!/usr/bin/env node

import { fetch } from "undici";

const API_KEY =
  "a2ad34f224f2dcd5e47df293662f72f3edc2fcb6499bb68cfc9d024ccad4d0bd";
const BASE_URL = "http://localhost:27123";

async function testNestedHeadings() {
  console.log("🔬 Testing nested heading syntax...\n");

  // Test different ways to target sub-headings
  const testCases = [
    { target: "Main Heading::Section 1", description: "Nested syntax with ::" },
    { target: "Main Heading::Tasks", description: "Nested syntax for Tasks" },
    { target: "Section 1", description: "Direct sub-heading name" },
    { target: "Tasks", description: "Direct Tasks heading" },
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Test: ${testCase.description}`);
    console.log(`   Target: "${testCase.target}"`);

    try {
      const response = await fetch(`${BASE_URL}/vault/test-clean.md`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Operation: "append",
          "Target-Type": "heading",
          Target: testCase.target,
          "Content-Type": "text/markdown",
          "Target-Delimiter": "::",
        },
        body: `\n- [ ] Added via ${testCase.description}`,
      });

      console.log(`   Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.log(
            `   ❌ Error: ${errorData.message} (${errorData.errorCode})`,
          );
        } catch {
          console.log(`   ❌ Error: ${errorText}`);
        }
      } else {
        console.log(`   ✅ Success!`);

        // Read back to confirm what happened
        const readResponse = await fetch(`${BASE_URL}/vault/test-clean.md`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        });

        if (readResponse.ok) {
          const content = await readResponse.text();
          console.log("   📄 Content now contains:");
          const lines = content.split("\n");
          const relevantLines = lines.filter(
            (line) => line.includes("Added via") || line.startsWith("#"),
          );
          relevantLines.forEach((line) => console.log(`     ${line}`));
        }

        console.log(); // Success, no need to test more on this file
        break;
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
    console.log();
  }
}

testNestedHeadings().catch(console.error);
