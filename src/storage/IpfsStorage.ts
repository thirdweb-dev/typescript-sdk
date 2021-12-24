import { FetchError, UploadError } from "../common/error";
import { MetadataURIOrObject } from "../core/types";
import { IStorage } from "../interfaces/IStorage";
import FileOrBuffer from "../types/FileOrBuffer";

if (!globalThis.FormData) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.FormData = require("form-data");
}

const thirdwebIpfsServerUrl = "https://upload.nftlabs.co";
const pinataIpfsUrl = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
// const thirdwebIpfsServerUrl = "http://localhost:3002";

export class IpfsStorage implements IStorage {
  private gatewayUrl: string;

  constructor(gatewayUrl: string) {
    this.gatewayUrl = `${gatewayUrl.replace(/\/$/, "")}/`;
  }

  public async upload(
    data: string | FileOrBuffer,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    const headers = {
      "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
      "X-Public-Address": signerAddress || "",
    };
    const formData = new FormData();
    formData.append("file", data as any);
    try {
      const res = await fetch(`${thirdwebIpfsServerUrl}/upload`, {
        method: "POST",
        body: formData as any,
        headers,
      });
      if (res.status !== 200) {
        throw new Error(
          `Failed to upload to IPFS [status code = ${res.status}]`,
        );
      }

      const body = await res.json();
      return body.IpfsUri;
    } catch (e) {
      throw new UploadError(`Failed to upload to IPFS: ${e}`);
    }
  }

  public async uploadBatch(
    files: Buffer[] | string[] | FileOrBuffer[] | File[],
    contractAddress?: string,
    fileStartNumber = 0,
  ): Promise<string> {
    const cid = await this.uploadBatchWithCid(
      files,
      contractAddress,
      fileStartNumber,
    );

    return `ipfs://${cid}/`;
  }

  private async uploadBatchWithCid(
    files: Buffer[] | string[] | FileOrBuffer[] | File[],
    contractAddress?: string,
    fileStartNumber = 0,
  ): Promise<string> {
    const token = await this.getUploadToken(contractAddress || "");
    const metadata = {
      name: `CONSOLE-TS-SDK-${contractAddress}`,
    };
    const data = new FormData();

    files.forEach((file, i) => {
      const filepath = `files/${fileStartNumber + i}`;
      if (typeof window === "undefined") {
        data.append("file", file as any, { filepath } as any);
      } else {
        // browser does blob things, filepath is parsed differently on browser vs node.
        // pls pinata?
        data.append("file", new Blob([file]), filepath);
      }
    });

    data.append("pinataMetadata", JSON.stringify(metadata));
    const res = await fetch(pinataIpfsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data as any,
    });
    const body = await res.json();
    if (!res.ok) {
      throw new UploadError("Failed to upload files to IPFS");
    }
    return body.IpfsHash;
  }

  public async getUploadToken(contractAddress: string): Promise<string> {
    const headers = {
      "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    };
    const res = await fetch(`${thirdwebIpfsServerUrl}/grant`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new FetchError(`Failed to get upload token`);
    }
    const body = await res.text();
    return body;
  }

  public async get(hash: string): Promise<string> {
    let uri = hash;
    if (hash) {
      uri = this.resolveFullUrl(hash);
    }
    try {
      const result = await fetch(uri);
      if (result.status !== 200) {
        throw new Error(`Status code (!= 200) =${result.status}`);
      }
      return await result.text();
    } catch (err: any) {
      throw new FetchError(`Failed to fetch IPFS file: ${uri}`, err);
    }
  }

  private async uploadFileHandler(object: any) {
    const keys = Object.keys(object);
    for (const key in keys) {
      const val = object[keys[key]];
      const shouldUpload = val instanceof File || val instanceof Buffer;

      if (shouldUpload) {
        object[keys[key]] = await this.upload(object[keys[key]]);
      }
      if (shouldUpload && typeof object[keys[key]] !== "string") {
        throw new Error("Upload to IPFS failed");
      }
      if (typeof val === "object") {
        object[keys[key]] = await this.uploadFileHandler(object[keys[key]]);
      }
    }
    return object;
  }

  /**
   * This function recurisely traverses an object and hashes any
   * `Buffer` or `File` objects into the returned map.
   *
   * @param object - The object to recurse over
   * @param files - The running array of files or buffer to upload
   * @returns - The final map of all hashes to files
   */
  public async buildFilePropertiesMap(
    object: any,
    files: (File | Buffer)[],
  ): Promise<(File | Buffer)[]> {
    const keys = Object.keys(object).sort();
    for (const key in keys) {
      const val = object[keys[key]];
      const shouldUpload = val instanceof File || val instanceof Buffer;
      if (shouldUpload) {
        files.push(val);
      }

      if (typeof val === "object") {
        await this.buildFilePropertiesMap(val, files);
      }
    }
    return files;
  }

  /**
   * Pre-processes metadata and uploads all file properties
   * to storage in *bulk*, then performs a string replacement of
   * all file properties -> the resulting ipfs uri. This is
   * called internally by `uploadMetadataBatch`.
   *
   * @internal
   *
   * @param metadata - The metadata to recursively process
   * @returns - The processed metadata with properties pointing at ipfs in place of `File | Buffer`
   */
  public async batchUploadProperties(metadata: object): Promise<any> {
    const filesToUpload = await this.buildFilePropertiesMap(metadata, []);
    if (filesToUpload.length === 0) {
      return metadata;
    }
    const cid = await this.uploadBatchWithCid(filesToUpload, "");
    const cids = [];

    // recurse ordered array
    for (const index in filesToUpload) {
      cids.push(`${cid}/${index}`);
    }

    const finalMetadata = await this.replaceFilePropertiesWithHashes(
      metadata,
      cids,
    );
    return finalMetadata;
  }

  /**
   * Given a map of file hashes to ipfs uris, this function will hash
   * all properties recursively and replace them with the ipfs uris
   * from the map passed in. If a hash is missing from the map, the function
   * will throw an error.
   *
   * @internal
   *
   * @param object - The object to recursively process
   * @param cids - The array of file hashes to ipfs uris in the recurse order
   * @returns - The processed metadata with properties pointing at ipfs in place of `File | Buffer`
   */
  private async replaceFilePropertiesWithHashes(object: any, cids: string[]) {
    const keys = Object.keys(object).sort();
    for (const key in keys) {
      const val = object[keys[key]];
      const isFile = val instanceof File || val instanceof Buffer;
      if (typeof val === "object" && !isFile) {
        await this.replaceFilePropertiesWithHashes(val, cids);
        continue;
      }

      if (!isFile) {
        continue;
      }

      object[keys[key]] = `ipfs://${cids.splice(0, 1)[0]}`;
    }
    return object;
  }

  public async uploadMetadata(
    metadata: MetadataURIOrObject,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    if (typeof metadata === "string") {
      return metadata;
    }

    metadata = await this.uploadFileHandler(metadata);

    return await this.upload(
      JSON.stringify(metadata),
      contractAddress,
      signerAddress,
    );
  }

  /**
   * @internal
   */
  public async uploadMetadataBatch(
    metadatas: MetadataURIOrObject[],
    contractAddress?: string,
    startFileNumber?: number,
  ) {
    const finalMetadata: MetadataURIOrObject[] =
      await this.batchUploadProperties(metadatas);
    return await this.uploadBatch(
      finalMetadata.map((m) => JSON.stringify(m)),
      contractAddress,
      startFileNumber,
    );
  }

  /**
   * Resolves the full url for a file using the configured gateway
   *
   * @param ipfsHash - the ipfs:// uri
   * @returns - The fully formed IPFS url with the gateway url
   * @internal
   */
  resolveFullUrl(ipfsHash: string): string {
    return ipfsHash && ipfsHash.toLowerCase().includes("ipfs://")
      ? ipfsHash.replace("ipfs://", this.gatewayUrl)
      : ipfsHash;
  }
}
