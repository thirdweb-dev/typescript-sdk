import type { providers } from "ethers";

export interface UploadProgressEvent {
  /**
   * The number of bytes uploaded.
   */
  progress: number;

  /**
   * The total number of bytes to be uploaded.
   */
  total: number;
}

/**
 * Standardized return type for contract events that returns event arguments
 */
export type ContractEvent = {
  eventName: string;
  data: Record<string, unknown>;
  transaction: Omit<providers.Log, "args">;
};

/**
 * Filters for querying past events
 */
export interface EventQueryFilter {
  fromBlock?: providers.BlockTag;
  toBlock?: providers.BlockTag;
  order?: "asc" | "desc";
}
