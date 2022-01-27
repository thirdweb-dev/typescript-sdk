import { FileOrBuffer, JsonObject } from "../types";

/**
 * @internal
 */
export interface UploadMetadataBatchResult {
  // base cid of the directory
  baseUri: string;

  // path to each of the file within the directory, included full cid path
  metadataUris: string[];
}

export interface IStorage {
  /**
   * Uploads a file to the storage.
   *
   * @param data - The data to be uploaded. Can be a file/buffer (which will be loaded), or a string.
   * @param contractAddress - Optional. The contract address the data belongs to.
   * @param signerAddress - Optional. The address of the signer.
   *
   * @returns - The hash of the uploaded data.
   */
  upload(
    data: string | FileOrBuffer,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string>;

  /**
   * Uploads a folder to storage.
   *
   * @param path - An array of the data to be uploaded. Can be a files or buffers (which will be loaded), or strings. (can be mixed, too)
   * @param fileStartNumber - Optional. The first file file name begins with.
   * @param contractAddress - Optional. The contract address the data belongs to.
   * @param signerAddress - Optional. The address of the signer.
   *
   * @returns - The CID of the uploaded folder.
   */
  uploadBatch(
    files: (string | FileOrBuffer)[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string>;

  /**
   * Fetches a one-time-use upload token that can used to upload
   * a file to storage.
   *
   * @returns - The one time use token that can be passed to the Pinata API.
   */
  getUploadToken(contractAddress: string): Promise<string>;

  /**
   * Fetches data from storage. This method does not handle any deserialization.
   * Its up to the caller to determine what the type of the data is.
   *
   * @param hash - The Hash of the file to fetch
   * @returns - The data, if found.
   */
  get(hash: string): Promise<string>;

  /**
   * Resolves the full URL of a file for a given gateway.
   *
   * For example, if the hash of a file is `ipfs://bafkreib3u2u6ir2fsl5nkuwixfsb3l4xehri3psjv5yga4inuzsjunk2sy`, then the URL will be:
   * "https://cloudflare-ipfs.com/ipfs/bafkreibnwjhx5s3r2rggdoy3hw7lr7wmgy4bas35oky3ed6eijklk2oyvq"
   * if the gateway is `cloudflare-ipfs.com`.
   *
   * @param hash - The hash of a file.
   */
  resolveFullUrl(hash: string): string;

  /**
   *
   * Uploads metadata to IPFS
   *
   * @param metadata - The metadata to be uploaded.
   * @param contractAddress - Optional. The contract address the data belongs to.
   * @param signerAddress - Optional. The address of the signer.
   */

  uploadMetadata<T extends string | JsonObject>(
    metadata: T,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string>;

  /**
   *
   * Uploads metadata to IPFS
   *
   * @param metadata - The metadata to be uploaded.
   * @param fileStartNumber - Optional. The first file file name begins with.
   * @param contractAddress - Optional. The contract address the data belongs to.
   * @param signerAddress - Optional. The address of the signer.
   */
  uploadMetadataBatch<T extends string | JsonObject>(
    metadatas: T[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<UploadMetadataBatchResult>;
}
