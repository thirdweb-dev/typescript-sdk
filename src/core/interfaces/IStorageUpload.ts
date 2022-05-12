import { EventEmitter2 } from "eventemitter2";
import { FileOrBuffer } from "../types";

/**
 * @internal
 */
export interface CidWithFileName {
  // base cid of the directory
  cid: string;

  // file name of the file without cid
  fileNames: string[];
}

export interface IStorageUpload extends EventEmitter2 {
  uploadBatchWithCid(
    files: (string | FileOrBuffer)[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
    listener?: (event: { progress: number; total: number }) => void,
  ): Promise<CidWithFileName>;
}
