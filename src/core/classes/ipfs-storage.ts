import {
  DuplicateFileNameError,
  FetchError,
  UploadError,
} from "../../common/error";
import {
  DEFAULT_IPFS_GATEWAY,
  PINATA_IPFS_URL,
  PUBLIC_GATEWAYS,
  TW_IPFS_SERVER_URL,
} from "../../constants/urls";
import { IStorage } from "../interfaces/IStorage";
import { FileOrBuffer, JsonObject } from "../types";
import {
  replaceFilePropertiesWithHashes,
  replaceHashWithGatewayUrl,
  resolveGatewayUrl,
} from "../helpers/storage";

if (!globalThis.FormData) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.FormData = require("form-data");
}

/**
 * @internal
 */
interface CidWithFileName {
  // base cid of the directory
  cid: string;

  // file name of the file without cid
  fileNames: string[];
}

/**
 * IPFS Storage implementation, accepts custom IPFS gateways
 * @public
 */
export class IpfsStorage implements IStorage {
  private gatewayUrl: string;
  private failedUrls: string[] = [];

  constructor(gatewayUrl: string = DEFAULT_IPFS_GATEWAY) {
    this.gatewayUrl = `${gatewayUrl.replace(/\/$/, "")}/`;
  }

  private getNextPublicGateway() {
    const urlsToTry = PUBLIC_GATEWAYS.filter(
      (url) => !this.failedUrls.includes(url),
    ).filter((url) => url !== this.gatewayUrl);
    if (urlsToTry.length > 0) {
      return urlsToTry[0];
    } else {
      this.failedUrls = [];
      return undefined;
    }
  }

  /**
   * {@inheritDoc IStorage.upload}
   */
  public async upload(
    data: string | FileOrBuffer,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    const cid = await this.uploadBatch(
      [data],
      0,
      contractAddress,
      signerAddress,
    );
    return `${cid}0`;
  }

  /**
   * {@inheritDoc IStorage.uploadBatch}
   */
  public async uploadBatch(
    files: (string | FileOrBuffer)[],
    fileStartNumber = 0,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    const { cid } = await this.uploadBatchWithCid(
      files,
      fileStartNumber,
      contractAddress,
      signerAddress,
    );

    return `ipfs://${cid}/`;
  }

  /**
   * {@inheritDoc IStorage.getUploadToken}
   */
  public async getUploadToken(contractAddress: string): Promise<string> {
    const headers = {
      "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    };
    const res = await fetch(`${TW_IPFS_SERVER_URL}/grant`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new FetchError(`Failed to get upload token`);
    }
    const body = await res.text();
    return body;
  }

  /**
   * {@inheritDoc IStorage.get}
   */
  public async get(hash: string): Promise<Record<string, any>> {
    const res = await this._get(hash);
    const json = await res.json();
    return replaceHashWithGatewayUrl(json, "ipfs://", this.gatewayUrl);
  }

  /**
   * {@inheritDoc IStorage.getRaw}
   */
  public async getRaw(hash: string): Promise<string> {
    const res = await this._get(hash);
    return await res.text();
  }

  /**
   * {@inheritDoc IStorage.uploadMetadata}
   */
  public async uploadMetadata(
    metadata: JsonObject,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    // since there's only single object, always use the first index
    const { metadataUris } = await this.uploadMetadataBatch(
      [metadata],
      0,
      contractAddress,
      signerAddress,
    );
    return metadataUris[0];
  }

  /**
   * {@inheritDoc IStorage.uploadMetadataBatch}
   */
  public async uploadMetadataBatch(
    metadatas: JsonObject[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ) {
    const metadataToUpload = (await this.batchUploadProperties(metadatas)).map(
      (m: any) => JSON.stringify(m),
    );

    const { cid, fileNames } = await this.uploadBatchWithCid(
      metadataToUpload,
      fileStartNumber,
      contractAddress,
      signerAddress,
    );

    const baseUri = `ipfs://${cid}/`;
    const uris = fileNames.map((filename) => `${baseUri}${filename}`);

    return {
      baseUri,
      metadataUris: uris,
    };
  }

  /** *************************
   * PRIVATE FUNCTIONS
   *************************/

  private async _get(hash: string): Promise<Response> {
    let uri = hash;
    if (hash) {
      uri = resolveGatewayUrl(hash, "ipfs://", this.gatewayUrl);
    }
    const result = await fetch(uri);
    if (!result.ok && result.status !== 404) {
      const nextUrl = this.getNextPublicGateway();
      if (nextUrl) {
        this.failedUrls.push(this.gatewayUrl);
        this.gatewayUrl = nextUrl;
        return this._get(hash);
      } else {
        throw new Error(`Error fetching ${uri} - Status code ${result.status}`);
      }
    }
    return result;
  }

  /**
   * Pre-processes metadata and uploads all file properties
   * to storage in *bulk*, then performs a string replacement of
   * all file properties -\> the resulting ipfs uri. This is
   * called internally by `uploadMetadataBatch`.
   *
   * @internal
   *
   * @param metadata - The metadata to recursively process
   * @returns - The processed metadata with properties pointing at ipfs in place of `File | Buffer`
   */
  private async batchUploadProperties(metadatas: JsonObject[]) {
    const filesToUpload = metadatas.flatMap((m) =>
      this.buildFilePropertiesMap(m, []),
    );
    if (filesToUpload.length === 0) {
      return metadatas;
    }
    const { cid, fileNames } = await this.uploadBatchWithCid(filesToUpload);

    const cids = [];
    // recurse ordered array
    for (const filename of fileNames) {
      cids.push(`${cid}/${filename}`);
    }

    const finalMetadata = await replaceFilePropertiesWithHashes(
      metadatas,
      cids,
    );
    return finalMetadata;
  }

  /**
   * This function recurisely traverses an object and hashes any
   * `Buffer` or `File` objects into the returned map.
   *
   * @param object - the Json Object
   * @param files - The running array of files or buffer to upload
   * @returns - The final map of all hashes to files
   */
  private buildFilePropertiesMap(
    object: JsonObject,
    files: (File | Buffer)[] = [],
  ): (File | Buffer)[] {
    if (Array.isArray(object)) {
      object.forEach((element) => {
        this.buildFilePropertiesMap(element, files);
      });
    } else if (object) {
      const values = Object.values(object);
      for (const val of values) {
        if (val instanceof File || val instanceof Buffer) {
          files.push(val);
        } else if (typeof val === "object") {
          this.buildFilePropertiesMap(val as JsonObject, files);
        }
      }
    }
    return files;
  }

  private async uploadBatchWithCid(
    files: (string | FileOrBuffer)[],
    fileStartNumber = 0,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<CidWithFileName> {
    const token = await this.getUploadToken(contractAddress || "");
    const metadata = {
      name: `CONSOLE-TS-SDK-${contractAddress}`,
      keyvalues: {
        sdk: "typescript",
        contractAddress,
        signerAddress,
      },
    };
    const data = new FormData();
    const fileNames: string[] = [];
    files.forEach((file, i) => {
      let fileName = "";
      let fileData = file;
      // if it is a file, we passthrough the file extensions,
      // if it is a buffer or string, the filename would be fileStartNumber + index
      // if it is a buffer or string with names, the filename would be the name
      if (file instanceof File) {
        let extensions = "";
        if (file.name) {
          const extensionStartIndex = file.name.lastIndexOf(".");
          if (extensionStartIndex > -1) {
            extensions = file.name.substring(extensionStartIndex);
          }
        }
        fileName = `${i + fileStartNumber}${extensions}`;
      } else if (file instanceof Buffer || typeof file === "string") {
        fileName = `${i + fileStartNumber}`;
      } else if (file && file.name && file?.data) {
        fileData = file?.data;
        fileName = `${file.name}`;
      } else {
        // default behavior
        fileName = `${i + fileStartNumber}`;
      }

      const filepath = `files/${fileName}`;
      if (fileNames.indexOf(fileName) > -1) {
        throw new DuplicateFileNameError(fileName);
      }
      fileNames.push(fileName);
      if (typeof window === "undefined") {
        data.append("file", fileData as any, { filepath } as any);
      } else {
        // browser does blob things, filepath is parsed differently on browser vs node.
        // pls pinata?
        data.append("file", new Blob([fileData as any]), filepath);
      }
    });

    data.append("pinataMetadata", JSON.stringify(metadata));
    const res = await fetch(PINATA_IPFS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data as any,
    });
    const body = await res.json();
    if (!res.ok) {
      console.log(body);
      throw new UploadError("Failed to upload files to IPFS");
    }
    return {
      cid: body.IpfsHash,
      fileNames,
    };
  }
}
