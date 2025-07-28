---
created: 2025-06-19T23:45
updated: 2025-06-20 08:52
type: documentation
tags:
  - claude-code
  - mcp
  - patch
---
# PATCH Fix Mission

## The Problem
PATCH operations in the MCP-Obsidian server are broken. When attempting to update parts of a document (like appending to a heading or updating frontmatter), the operations fail with errors like:
- `invalid-target (40080)`
- `Failed to parse JSON`
- Previously: `[object Object]` was inserted into files

## Your Goal
Make PATCH operations work correctly so users can efficiently update specific parts of documents without rewriting entire files.

## What Success Looks Like
This should work without errors:
```typescript
// Example: Append a task to a heading
await obsidian_patch_file({
  filename: "test.md",
  operation: "append",
  targetType: "heading",
  target: "## Tasks",
  content: "- [ ] New task"
});

// Example: Update frontmatter
await obsidian_patch_file({
  filename: "test.md",
  operation: "replace",
  targetType: "frontmatter",
  target: "updated",
  content: "2025-06-19T23:45"
});
```

## Resources Available
1. **The codebase** - src/index.ts contains the patch functions
2. **API Specification** - Full OpenAPI spec in `docs/openapi.yaml`
3. **Technical context** - See implementation-plan.md for quick reference
4. **Test files** - Located in the vault at `99 system/ai-workspace/patch-test*.md`
5. **Previous fix attempt** - Boolean handling and Content-Type were addressed but issues persist

## Your Approach
You decide how to:
- Investigate why it's failing
- Add logging/debugging as needed
- Test your changes
- Verify the fix works

The key file is `src/index.ts` but explore as needed. You're the expert - solve it however makes sense to you.