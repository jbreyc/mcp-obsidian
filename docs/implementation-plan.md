---
created: 2025-06-19T23:50
updated: 2025-06-20 08:52
type: reference
tags:
  - api
  - patch
  - headers
---
# Technical Context for PATCH Operations

## Full API Specification Available
📄 **See `openapi.yaml` in this docs folder for the complete Obsidian Local REST API specification**

The OpenAPI spec contains:
- Detailed PATCH endpoint definitions
- All parameter descriptions
- Complete examples with edge cases
- Error code definitions
- Request/response schemas

## Quick Reference: PATCH Headers
The REST API PATCH endpoint requires these HTTP headers:
```
Operation: append | prepend | replace
Target-Type: heading | block | frontmatter
Target: <the specific target>
Target-Delimiter: :: (optional, for nested headings)
Trim-Target-Whitespace: true | false (optional)
Content-Type: text/markdown | application/json
Authorization: Bearer <API_KEY>
```

## Current Symptoms
1. `invalid-target (40080)` - The API is being reached but rejecting the request
2. `Failed to parse JSON` - Possibly related to content or header formatting
3. Previous symptom: `[object Object]` was being inserted (partially fixed)

## What Was Already Tried
- Fixed boolean handling for `trimTargetWhitespace` (converts to string)
- Ensured Content-Type defaults to `text/markdown`
- Applied fixes to all three PATCH methods

## Testing Hints
- The MCP server runs on the local machine
- Test files exist in the vault for experimentation
- You can add logging to see exact HTTP requests being made
- Consider comparing with a working curl command to the REST API
- Check the openapi.yaml for exact parameter requirements and examples