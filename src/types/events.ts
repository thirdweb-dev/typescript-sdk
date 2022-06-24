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
  data: Record<string, any>;
};

/**
 * Filters for querying past events
 */
export interface QueryAllEvents {
  eventName?: string;
  fromBlock?: number;
  toBlock?: number;
}
