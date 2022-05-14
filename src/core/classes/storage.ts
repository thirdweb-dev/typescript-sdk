import { JsonObject } from "..";
import { FileOrBuffer } from "../..";
import { UploadProgressEvent } from "../../types/events";
import { IStorage } from "../interfaces/IStorage";
import { CidWithFileName } from "../interfaces/IStorageUpload";

interface StorageUpload {
  /**
   * Base URI of the directory that all files are uploaded to.
   */
  baseUri: string;
  /**
   * Individual URI for each file or metadata upload.
   */
  uris: string[];
}
export class Storage {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Fetch data from any IPFS hash without worrying about gateways, data types, etc.
   * Simply pass in an IPFS url and we'll handle fetching for you and try every public gateway
   * to get the fastest response.
   *
   * @example
   * ```javascript
   * // Your IPFS hash here
   * const hash = "ipfs://..."
   * const data = await sdk.storage.fetch(hash);
   * ```
   * @param hash - The IPFS hash of the file or data to fetch
   * @returns The data stored at the specified IPFS hash
   */
  public async fetch(hash: string): Promise<Record<string, any>> {
    return this.storage.get(hash);
  }

  /**
   * Upload any data to an IPFS directory.
   *
   * @example
   * ```javascript
   * // Add all your data here
   * const files = [
   *   fs.readFileSync("file1.png"),
   *   fs.readFileSync("file2.png"),
   *   fs.readFileSync("file3.png"),
   * ]
   * const uri = await sdk.storage.upload(files);
   * ```
   *
   * @param data - An array of file data or an array of JSON metadata to upload to IPFS
   * @returns The IPFS hash of the directory that holds all the uploaded data
   */
  public async upload(
    data: FileOrBuffer[] | JsonObject[] | FileOrBuffer | JsonObject,
    options?: {
      onProgress: (event: UploadProgressEvent) => void;
    },
  ): Promise<StorageUpload> {
    if (!Array.isArray(data)) {
      if (
        data instanceof File ||
        data instanceof Buffer ||
        (data.name && data.data && data.data instanceof Buffer)
      ) {
        return this.uploadBatch([data as FileOrBuffer], options);
      } else {
        return this.uploadMetadataBatch([data as JsonObject], options);
      }
    }

    const allFiles = (data as any[]).filter(
      (item: any) =>
        item instanceof File ||
        item instanceof Buffer ||
        (item.name && item.data && item.data instanceof Buffer),
    );
    const allObjects = (data as any[]).filter(
      (item: any) => !(item instanceof File) && !(item instanceof Buffer),
    );
    if (allFiles.length === data.length) {
      return this.uploadBatch(data as FileOrBuffer[], options);
    } else if (allObjects.length === data.length) {
      return this.uploadMetadataBatch(data as JsonObject[], options);
    } else {
      throw new Error(
        "Data to upload must be either all files or all JSON objects",
      );
    }
  }

  private async uploadBatch(
    files: FileOrBuffer[],
    options?: {
      onProgress: (event: UploadProgressEvent) => void;
    },
  ): Promise<StorageUpload> {
    const { cid, fileNames } = await this.storage.uploader.uploadBatchWithCid(
      files,
      undefined,
      undefined,
      undefined,
      options,
    );
    const baseUri = `ipfs://${cid}/`;
    const uris = fileNames.map((name) => `${baseUri}${name}`);
    return {
      baseUri,
      uris,
    };
  }

  private async uploadMetadataBatch(
    metadatas: JsonObject[],
    options?: {
      onProgress: (event: UploadProgressEvent) => void;
    },
  ): Promise<StorageUpload> {
    const { baseUri, metadataUris } = await this.storage.uploadMetadataBatch(
      metadatas,
      undefined,
      undefined,
      undefined,
      options,
    );
    return {
      baseUri,
      uris: metadataUris,
    };
  }
}
