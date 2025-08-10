export interface Transport {
  start(): Promise<void>;
  stop(): Promise<void>;
}
