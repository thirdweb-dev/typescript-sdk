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

export type ContractEvent = {
  eventName: string;
  data: Record<string, any>;
};
