import { FileOrBuffer, JsonObject } from "../../src/core/types";
import { v4 as uuidv4 } from "uuid";
import { IStorage, NotFoundError, UploadMetadataBatchResult } from "../../src";
import { BufferOrStringWithName } from "../../src/types/BufferOrStringWithName";

export class MockStorage implements IStorage {
  private objects: { [key: string]: string } = {};
  private folders: { [cid: string]: { [id: string]: string } } = {};

  public async upload(
    data: string | FileOrBuffer,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    const uuid = uuidv4();
    let serializedData = "";

    if (data instanceof File) {
      serializedData = await data.text();
    } else if (data instanceof Buffer) {
      serializedData = data.toString();
    } else if (typeof data === "string") {
      serializedData = data;
    }

    const key = `mock://${uuid}`;
    this.objects[uuid] = serializedData;
    return Promise.resolve(key);
  }

  public async uploadBatch(
    files:
      | Buffer[]
      | string[]
      | FileOrBuffer[]
      | File[]
      | BufferOrStringWithName[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    const cid = uuidv4();
    this.folders[cid] = {};

    let index = fileStartNumber ? fileStartNumber : 0;
    for (const file of files) {
      let contents: string;
      if (file instanceof File) {
        contents = await file.text();
      } else if (file instanceof Buffer) {
        contents = file.toString();
      } else if (typeof file === "string") {
        contents = file;
      } else {
        contents =
          file.data instanceof Buffer ? file.data.toString() : file.data;
        this.folders.cid[file.name] = contents;
        continue;
      }
      this.folders[cid][index.toString()] = contents;

      index += 1;
    }

    return Promise.resolve(`mock://${cid}`);
  }

  public async getUploadToken(contractAddress: string): Promise<string> {
    return Promise.resolve("mock-token");
  }

  get(hash: string): Promise<string> {
    hash = hash.replace("mock://", "").replace("fake://", "");
    const split = hash.split("/");
    if (split.length === 1) {
      if (hash in this.objects) {
        return Promise.resolve(this.objects[hash]);
      } else {
        throw new NotFoundError(hash);
      }
    }
    const [cid, index] = split;
    if (!(cid in this.folders)) {
      throw new NotFoundError(cid);
    }
    if (!(index in this.folders[cid])) {
      throw new NotFoundError(`${cid}/${index}`);
    }
    return Promise.resolve(this.folders[cid][index.toString()]);
  }

  resolveFullUrl(hash: string): string {
    if (typeof hash !== "string") {
      return hash;
    }
    return hash.replace("mock://", "fake://");
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
    );

    return metadataUris[0];
  }

  public async uploadMetadataBatch<T extends string | JsonObject>(
    metadatas: T[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<UploadMetadataBatchResult> {
    const metadataObjects = metadatas.filter((m) => typeof m !== "string");
    await this.batchUploadProperties(metadatas);

    const metadataToUpload: string[] = metadataObjects.map((m: any) =>
      JSON.stringify(m),
    );

    const cid = await this.uploadBatch(
      metadataToUpload,
      fileStartNumber,
      contractAddress,
      signerAddress,
    );
    return {
      metadataUris: metadataToUpload.map((m, i) => `${cid}/${i}`),
      baseUri: cid,
    };
  }

  public canResolve(uri: string): boolean {
    const resolved = this.resolveFullUrl(uri);
    return resolved.toLowerCase() !== uri.toLowerCase();
  }

  private async uploadProperties(object: Record<string, any>): Promise<void> {
    const keys = Object.keys(object).sort();
    for (const key in keys) {
      const val = object[keys[key]];
      const shouldUpload = val instanceof File || val instanceof Buffer;
      if (shouldUpload) {
        object[keys[key]] = await this.upload(val);
      }

      if (typeof val === "object") {
        this.uploadProperties(val);
      }
    }
  }

  private async batchUploadProperties<T extends string | JsonObject>(
    metadatas: T[],
  ): Promise<any> {
    if (typeof metadatas === "string") {
      return metadatas;
    }

    for (const file of metadatas) {
      if (typeof file === "string") {
        continue;
      }
      await this.uploadProperties(file);
    }
  }
}
