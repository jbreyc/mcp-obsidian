export type TransportMode = "stdio" | "http" | "https";

export interface BaseConfig {
  mode: TransportMode;
  obsidian: ObsidianConfig;
}

export interface ObsidianConfig {
  apiKey: string;
  protocol: "http" | "https";
  host: string;
  port: number;
}

export interface StdioConfig extends BaseConfig {
  mode: "stdio";
}

export interface HttpConfig extends BaseConfig {
  mode: "http";
  port: number;
}

export interface HttpsConfig extends BaseConfig {
  mode: "https";
  port: number;
  certPath: string;
  keyPath: string;
}

export type Config = StdioConfig | HttpConfig | HttpsConfig;
