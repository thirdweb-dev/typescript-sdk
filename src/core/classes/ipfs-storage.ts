import { z } from "zod";
import {
  DuplicateFileNameError,
  FetchError,
  UploadError,
} from "../../common/error";
import {
  DEFAULT_IPFS_GATEWAY,
  PINATA_IPFS_URL,
  TW_IPFS_SERVER_URL,
} from "../../constants/urls";
import { JsonObjectSchema } from "../../schema/shared";
import { IStorage } from "../interfaces/IStorage";
import { FileOrBuffer, Json, JsonObject } from "../types";

if (!global.FormData) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.FormData = require("form-data");
}

// const thirdwebIpfsServerUrl = "http://localhost:3002";

/**
 * @internal
 */
interface CidWithFileName {
  // base cid of the directory
  cid: string;

  // file name of the file without cid
  fileNames: string[];
}

export class IpfsStorage implements IStorage {
  private gatewayUrl: string;

  constructor(gatewayUrl: string = DEFAULT_IPFS_GATEWAY) {
    this.gatewayUrl = `${gatewayUrl.replace(/\/$/, "")}/`;
  }

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

  private async uploadBatchWithCid(
    files: (string | FileOrBuffer)[],
    fileStartNumber = 0,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<CidWithFileName> {
    const token = await this.getUploadToken(contractAddress || "");
    const metadata = {
      sdk: "typescript",
      contractAddress,
      signerAddress,
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

  private async _get(hash: string): Promise<Response> {
    let uri = hash;
    if (hash) {
      uri = this.resolveFullUrl(hash);
    }
    const result = await fetch(uri);
    if (!result.ok) {
      throw new Error(`Status code (!= 200) =${result.status}`);
    }
    return result;
  }

  public async get(hash: string) {
    const res = await this._get(hash);
    return res.text();
  }

  public async getMetadata(
    hash: string,
  ): Promise<z.output<typeof JsonObjectSchema>> {
    const res = await this._get(hash);
    const json = JsonObjectSchema.parse(await res.json());

    const allProps = Object.keys(json);
    for (const key in allProps) {
      if (typeof json[key] === "object") {
        const props = JsonObjectSchema.parse(json[key]);
        const keys = Object.keys(props);
        for (const _key of keys) {
          props[_key] = this.resolveFullUrl(props[_key]);
        }
      }
      json[key] = this.resolveFullUrl(json[key]);
    }

    return JsonObjectSchema.parse(json);
  }

  /**
   * This function recurisely traverses an object and hashes any
   * `Buffer` or `File` objects into the returned map.
   *
   * @param object - the Json Object
   * @param files - The running array of files or buffer to upload
   * @returns - The final map of all hashes to files
   */
  public buildFilePropertiesMap(
    object: Json,
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
          this.buildFilePropertiesMap(val, files);
        }
      }
    }
    return files;
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
  public async batchUploadProperties(metadatas: Json[]) {
    if (typeof metadatas === "string") {
      return metadatas;
    }
    const filesToUpload = this.buildFilePropertiesMap(metadatas, []);
    if (filesToUpload.length === 0) {
      return metadatas;
    }
    const { cid, fileNames } = await this.uploadBatchWithCid(filesToUpload);

    const cids = [];
    // recurse ordered array
    for (const filename of fileNames) {
      cids.push(`${cid}/${filename}`);
    }

    const finalMetadata = await this.replaceFilePropertiesWithHashes(
      metadatas,
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
  private async replaceFilePropertiesWithHashes(
    object: Record<string, any>,
    cids: string[],
  ) {
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

  public async uploadMetadata<T extends string | JsonObject>(
    metadata: T,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    if (typeof metadata === "string") {
      return metadata;
    }

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
   * @internal
   */
  public async uploadMetadataBatch<T extends string | JsonObject>(
    metadatas: T[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ) {
    // we only want to upload if the metadata object is not a string
    const metadataObjects = metadatas.filter((m) => typeof m !== "string");
    const metadataToUpload = (
      await this.batchUploadProperties(metadataObjects)
    ).map((m: any) => JSON.stringify(m));

    // batch upload non-string metadata object
    if (metadataToUpload.length === 0) {
      return {
        baseUri: "",
        metadataUris: metadatas.filter(
          (m) => typeof m === "string",
        ) as string[],
      };
    }

    const { cid, fileNames } = await this.uploadBatchWithCid(
      metadataToUpload,
      fileStartNumber,
      contractAddress,
      signerAddress,
    );

    const baseUri = `ipfs://${cid}/`;
    const uris = [];
    for (const metadata of metadatas) {
      if (typeof metadata === "string") {
        uris.push(metadata);
      } else {
        uris.push(`${baseUri}${fileNames.splice(0, 1)[0]}`);
      }
    }

    return {
      baseUri,
      metadataUris: uris,
    };
  }

  /**
   * Resolves the full url for a file using the configured gateway
   *
   * @param ipfsHash - the ipfs:// uri
   * @returns - The fully formed IPFS url with the gateway url
   * @internal
   */
  resolveFullUrl<T>(ipfsHash: T): T {
    if (typeof ipfsHash === "string") {
      return (ipfsHash.toLowerCase().includes("ipfs://")
        ? ipfsHash.replace("ipfs://", this.gatewayUrl)
        : ipfsHash) as unknown as T;
    }
    return ipfsHash;
  }
}
