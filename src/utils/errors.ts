export class ConfigurationError extends Error {
  constructor(
    message: string,
    public solution?: string,
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function logErrorAndExit(error: Error): never {
  console.error("❌ Failed to start MCP Server:");
  console.error(`   ${error.message}`);
  if (error instanceof ConfigurationError && error.solution) {
    console.error(`\n   Solution: ${error.solution}`);
  }
  process.exit(1);
}
