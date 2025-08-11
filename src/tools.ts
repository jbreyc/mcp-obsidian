import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Obsidian } from "@/obsidian";
import type { Config } from "@/types/config";

export function registerTools(server: McpServer, config: Config) {
  const obsidian = new Obsidian(config.obsidian);
  server.tool(
    "obsidian_status",
    "Returns Obsidian REST API server status and authentication info. Good for testing connection.",
    async () => {
      const status = await obsidian.status();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status),
          },
        ],
      };
    },
  );

  server.tool(
    "obsidian_delete_active",
    "Permanently deletes the currently-active file in Obsidian. Cannot be undone!",
    async () => {
      await obsidian.deleteActive();
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_get_active",
    "Returns the content of the currently-active file as JSON with 'content' field containing the full file text including frontmatter.",
    async () => {
      const note = await obsidian.getActive();
      return {
        content: [{ type: "text", text: JSON.stringify(note) }],
      };
    },
  );

  server.tool(
    "obsidian_patch_active",
    "PATCH content into the active file. IMPORTANT: The target (heading/block) is a LOCATOR ONLY - DO NOT include it in content!\n\nFor headings:\n- Use 'Title' for any heading (no # symbols)\n- Use 'Parent::Child' for nested headings where Parent is the exact text of the parent heading and Child is the nested heading\n- The hierarchy path must include ALL parent headings from the target back to its root\n- Example: To target ### Subsection under ## Section under # Main, use: 'Main::Section::Subsection'\n- Example: To target ## Section at root level, use just: 'Section'\n- Heading hierarchy is determined by markdown heading levels (#, ##, ###, etc.), not visual appearance\n\nFor blocks: Use block ID without ^\nFor frontmatter: Use field name\n\nContent will be inserted UNDER the target. Use actual newlines, not \\n.",
    {
      operation: z
        .enum(["append", "prepend", "replace"])
        .describe(
          "append: add after, prepend: add before, replace: replace content UNDER target",
        ),
      targetType: z
        .enum(["heading", "block", "frontmatter"])
        .describe("Type of target locator"),
      target: z
        .string()
        .describe(
          "Target locator: For heading use 'Title' (no #), for nested 'Parent::Child', for block use ID without ^, for frontmatter use field name",
        ),
      content: z
        .string()
        .describe(
          "Content to insert - DO NOT include the target heading! Will be placed UNDER the target. Use actual line breaks, not \\n",
        ),
      trimTargetWhitespace: z.boolean().optional(),
      targetDelimiter: z
        .string()
        .optional()
        .describe("Delimiter for nested headings (default: ::)"),
      contentType: z.string().optional(),
    },
    async (args) => {
      const res = await obsidian.patchActive(args);
      return {
        content: [{ type: "text", text: JSON.stringify(res) }],
      };
    },
  );

  server.tool(
    "obsidian_post_active",
    "Appends content to the END of the active file (after all existing content).",
    { content: z.string().describe("Content to append at the end of file") },
    async (args) => {
      await obsidian.postActive(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_put_active",
    "Replaces ENTIRE content of the active file including frontmatter. Previous content will be lost.",
    {
      content: z
        .string()
        .describe("Complete file content including frontmatter if needed"),
    },
    async (args) => {
      await obsidian.putActive(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_get_commands",
    "Returns all available Obsidian commands as JSON array with id and name fields. Use command IDs with obsidian_execute_command.",
    async () => {
      const commands = await obsidian.getCommands();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(commands),
          },
        ],
      };
    },
  );

  server.tool(
    "obsidian_execute_command",
    "Executes an Obsidian command by ID. Use obsidian_get_commands first to find available command IDs.",
    {
      commandId: z
        .string()
        .describe("Command ID to execute (e.g. 'editor:toggle-bold')"),
    },
    async (args) => {
      await obsidian.executeCommand(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_open_file",
    "Opens a file in Obsidian UI. Creates the file if it doesn't exist. File will become the active note.",
    {
      filename: z
        .string()
        .describe(
          "Path to file relative to vault root. No URL encoding needed.",
        ),
      newLeaf: z
        .boolean()
        .nullish()
        .describe("Open in new pane/tab (true) or current pane (false/null)"),
    },
    async (args) => {
      await obsidian.openFile(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_delete_periodic",
    "Permanently deletes the periodic note for today/this week/month/etc. Cannot be undone!",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
    },
    async (args) => {
      await obsidian.deletePeriodic(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_get_periodic",
    "Returns the periodic note for a given period as JSON with 'content' field containing the full file text.",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
    },
    async (args) => {
      const note = await obsidian.getPeriodic(args);
      return {
        content: [{ type: "text", text: JSON.stringify(note) }],
      };
    },
  );

  server.tool(
    "obsidian_patch_periodic",
    "PATCH content into a periodic note. IMPORTANT: The target (heading/block) is a LOCATOR ONLY - DO NOT include it in content!\n\nFor headings:\n- Use 'Title' for any heading (no # symbols)\n- Use 'Parent::Child' for nested headings where Parent is the exact text of the parent heading and Child is the nested heading\n- The hierarchy path must include ALL parent headings from the target back to its root\n- Example: To target ### Subsection under ## Section under # Main, use: 'Main::Section::Subsection'\n- Example: To target ## Section at root level, use just: 'Section'\n- Heading hierarchy is determined by markdown heading levels (#, ##, ###, etc.), not visual appearance\n\nFor blocks: Use block ID without ^\nFor frontmatter: Use field name\n\nContent will be inserted UNDER the target. Use actual newlines, not \\n.",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
      operation: z
        .enum(["append", "prepend", "replace"])
        .describe(
          "append: add after, prepend: add before, replace: replace content UNDER target",
        ),
      targetType: z
        .enum(["heading", "block", "frontmatter"])
        .describe("Type of target locator"),
      target: z
        .string()
        .describe(
          "Target locator: For heading use 'Title' (no #), for nested 'Parent::Child', for block use ID without ^, for frontmatter use field name",
        ),
      content: z
        .string()
        .describe(
          "Content to insert - DO NOT include the target heading! Will be placed UNDER the target. Use actual line breaks, not \\n",
        ),
      trimTargetWhitespace: z.boolean().optional(),
      targetDelimiter: z
        .string()
        .optional()
        .describe("Delimiter for nested headings (default: ::)"),
      contentType: z.string().optional(),
    },
    async (args) => {
      await obsidian.patchPeriodic(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_post_periodic",
    "Appends content to the END of the periodic note (after all existing content). Creates note if it doesn't exist.",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
      content: z.string().describe("Content to append at the end of file"),
    },
    async (args) => {
      await obsidian.postPeriodic(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_put_periodic",
    "Replaces ENTIRE content of the periodic note including frontmatter. Previous content will be lost.",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
      content: z
        .string()
        .describe("Complete file content including frontmatter if needed"),
    },
    async (args) => {
      await obsidian.putPeriodic(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_search_dataview",
    "Searches vault using a Dataview DQL query. Returns results as JSON array. Requires Dataview plugin.",
    {
      query: z
        .string()
        .describe(
          "Dataview DQL query (e.g. 'LIST FROM #tag WHERE date > date(2024-01-01)')",
        ),
    },
    async (args) => {
      const results = await obsidian.searchDataview(args);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }],
      };
    },
  );

  server.tool(
    "obsidian_search_json_logic",
    "Searches vault metadata using JsonLogic query syntax. Returns matching files as JSON array.",
    {
      logic: z
        .unknown()
        .describe("JsonLogic query object for searching file metadata"),
    },
    async ({ logic }) => {
      const results = await obsidian.searchJsonLogic(logic);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }],
      };
    },
  );

  server.tool(
    "obsidian_simple_search",
    "Full-text search across all vault files. Returns matches with surrounding context.",
    {
      query: z.string().describe("Search text (fuzzy matching supported)"),
      contextLength: z
        .number()
        .optional()
        .describe("Number of characters to show around match (default: 100)"),
    },
    async (args) => {
      const results = await obsidian.simpleSearch(args);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }],
      };
    },
  );

  server.tool(
    "obsidian_list_vault_root",
    "Lists all files and folders in the vault root directory. Returns array of names.",
    async () => {
      const files = await obsidian.listVaultRoot();
      return {
        content: [{ type: "text", text: JSON.stringify(files) }],
      };
    },
  );

  server.tool(
    "obsidian_list_vault_directory",
    "Lists files and subdirectories in a specified directory. Returns array of file/folder names.",
    {
      pathToDirectory: z
        .string()
        .describe(
          "Path to directory relative to vault root. No URL encoding needed.",
        ),
    },
    async (args) => {
      const files = await obsidian.listVaultDirectory(args);
      return {
        content: [{ type: "text", text: JSON.stringify(files) }],
      };
    },
  );

  server.tool(
    "obsidian_delete_file",
    "Deletes a file or folder in the vault. Be careful - this is permanent!",
    {
      filename: z
        .string()
        .describe(
          "Path to file or folder relative to vault root. No URL encoding needed.",
        ),
    },
    async (args) => {
      await obsidian.deleteFile(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_get_file",
    "Returns content of a vault file as JSON with 'content' field containing the full file text including frontmatter. Path must be relative to vault root, no URL encoding needed.",
    {
      filename: z
        .string()
        .describe(
          "Path to file relative to vault root (e.g. 'folder/file.md'). No URL encoding needed.",
        ),
    },
    async (args) => {
      const file = await obsidian.getFile(args);
      return {
        content: [{ type: "text", text: JSON.stringify(file) }],
      };
    },
  );

  server.tool(
    "obsidian_patch_file",
    "PATCH content into a vault file. IMPORTANT: The target (heading/block) is a LOCATOR ONLY - DO NOT include it in content!\n\nFor headings:\n- Use 'Title' for any heading (no # symbols)\n- Use 'Parent::Child' for nested headings where Parent is the exact text of the parent heading and Child is the nested heading\n- The hierarchy path must include ALL parent headings from the target back to its root\n- Example: To target ### Subsection under ## Section under # Main, use: 'Main::Section::Subsection'\n- Example: To target ## Section at root level, use just: 'Section'\n- Heading hierarchy is determined by markdown heading levels (#, ##, ###, etc.), not visual appearance\n\nFor blocks: Use block ID without ^\nFor frontmatter: Use field name\n\nContent will be inserted UNDER the target. Use actual newlines, not \\n.",
    {
      filename: z
        .string()
        .describe("Path to file in vault (no URL encoding needed)"),
      operation: z
        .enum(["append", "prepend", "replace"])
        .describe(
          "append: add after, prepend: add before, replace: replace content UNDER target",
        ),
      targetType: z
        .enum(["heading", "block", "frontmatter"])
        .describe("Type of target locator"),
      target: z
        .string()
        .describe(
          "Target locator: For heading use 'Title' (no #), for nested 'Parent::Child', for block use ID without ^, for frontmatter use field name",
        ),
      content: z
        .string()
        .describe(
          "Content to insert - DO NOT include the target heading! Will be placed UNDER the target. Use actual line breaks, not \\n",
        ),
      trimTargetWhitespace: z.boolean().optional(),
      targetDelimiter: z
        .string()
        .optional()
        .describe("Delimiter for nested headings (default: ::)"),
      contentType: z.string().optional(),
    },
    async (args) => {
      await obsidian.patchFile(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_post_file",
    "Appends content to the END of a vault file (after all existing content). Creates file if it doesn't exist.",
    {
      filename: z
        .string()
        .describe(
          "Path to file relative to vault root. No URL encoding needed.",
        ),
      content: z.string().describe("Content to append at the end of file"),
    },
    async (args) => {
      await obsidian.postFile(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );

  server.tool(
    "obsidian_put_file",
    "Creates new file or replaces ENTIRE content of existing file including frontmatter. Previous content will be lost if file exists.",
    {
      filename: z
        .string()
        .describe(
          "Path to file relative to vault root. No URL encoding needed.",
        ),
      content: z
        .string()
        .describe("Complete file content including frontmatter if needed"),
    },
    async (args) => {
      await obsidian.putFile(args);
      return {
        content: [{ type: "text", text: "OK" }],
      };
    },
  );
}
