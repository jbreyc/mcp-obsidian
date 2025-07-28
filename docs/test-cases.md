---
created: 2025-06-20T00:00
updated: 2025-06-20 08:46
type: reference
tags:
  - testing
  - examples
---
# Test Scenarios & Examples

## Available Test Files
- `99 system/ai-workspace/patch-test.md` - Contains various headings, blocks, and frontmatter
- `99 system/ai-workspace/patch-test-v2.md` - Alternative test file

## Scenarios That Should Work

### 1. Append Task to Heading
```typescript
obsidian_patch_file({
  filename: "99 system/ai-workspace/patch-test.md",
  operation: "append",
  targetType: "heading",
  target: "## Tasks",
  content: "- [ ] New task via PATCH"
})
```
Should add the task to the existing Tasks section.

### 2. Update Frontmatter Field
```typescript
obsidian_patch_file({
  filename: "99 system/ai-workspace/patch-test.md",
  operation: "replace",
  targetType: "frontmatter",
  target: "updated",
  content: "2025-06-20T00:00"
})
```
Should update only the 'updated' field in frontmatter.

### 3. Work with Nested Headings
```typescript
obsidian_patch_file({
  filename: "99 system/ai-workspace/patch-test.md",
  operation: "prepend",
  targetType: "heading",
  target: "Heading 1::Subheading 1.1",
  content: "> Note: Added via PATCH\n\n"
})
```
The :: delimiter should handle nested headings.

### 4. Append to Block Reference
```typescript
obsidian_patch_file({
  filename: "99 system/ai-workspace/patch-test.md",
  operation: "append",
  targetType: "block",
  target: "block1",
  content: "\n\nAdditional content."
})
```
Should add content after the ^block1 reference.

### 5. JSON Content for Tables
```typescript
obsidian_patch_file({
  filename: "99 system/ai-workspace/patch-test.md",
  operation: "append",
  targetType: "block",
  target: "table1",
  content: JSON.stringify([["Chicago, IL", "10"]]),
  contentType: "application/json"
})
```
Should add a new row to the table.

## Current Errors
- `invalid-target (40080)` - Target not found or incorrectly specified
- `Failed to parse JSON` - Content or request format issue

## Testing Approach
You decide how to test. Options include:
- Direct testing through MCP
- Creating a test script
- Adding logging to see actual HTTP requests
- Comparing with curl commands to the REST API
- Whatever makes sense to you

The goal: Make these examples work correctly.