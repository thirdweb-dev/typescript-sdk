import { v4 as uuidv4 } from "uuid";
import {
  IStorage,
  MetadataURIOrObject,
  NotFoundError,
  UploadMetadataBatchResult,
} from "../../src";
import { BufferOrStringWithName } from "../../src/types/BufferOrStringWithName";
import FileOrBuffer from "../../src/types/FileOrBuffer";

export class MockStorage implements IStorage {
  private objects: { [key: string]: string } = {};
  private folders: { [cid: string]: { [id: string]: string } } = {};

  public async upload(
    data: string | FileOrBuffer,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    const uuid = uuidv4();

    if (data instanceof File) {
      data = await data.text();
    } else if (data instanceof Buffer) {
      data = data.toString();
    }

    const key = `mock://${uuid}`;
    this.objects[uuid] = data;
    return Promise.resolve(key);
  }

  public async uploadBatch(
    files:
      | Buffer[]
      | string[]
      | FileOrBuffer[]
      | File[]
      | BufferOrStringWithName[],
    contractAddress?: string,
    uploadFileStartNumber?: number,
  ): Promise<string> {
    const cid = uuidv4();
    this.folders[cid] = {};

    let index = uploadFileStartNumber ? uploadFileStartNumber : 0;
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
    hash = hash.replace("mock://", "");
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

  public async uploadMetadata(
    metadata: MetadataURIOrObject,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<string> {
    if (typeof metadata === "string") {
      return metadata;
    }

    // since there's only single object, always use the first index
    const { metadataUris } = await this.uploadMetadataBatch(
      [metadata],
      contractAddress,
      0,
    );

    return metadataUris[0];
  }

  public async uploadMetadataBatch(
    metadatas: MetadataURIOrObject[],
    contractAddress?: string,
    fileStartNumber?: number,
  ): Promise<UploadMetadataBatchResult> {
    const metadataObjects = metadatas.filter((m) => typeof m !== "string");
    await this.batchUploadProperties(metadatas);

    const metadataToUpload: string[] = metadataObjects.map((m: any) =>
      JSON.stringify(m),
    );

    const cid = await this.uploadBatch(
      metadataToUpload,
      contractAddress,
      fileStartNumber,
    );
    return {
      metadataUris: metadataToUpload.map((m, i) => `${cid}/${i}`),
      baseUri: cid,
    };
  }

  public getIdentifyingPrefix(): string {
    return "mock://";
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

  private async batchUploadProperties(
    metadatas: MetadataURIOrObject[],
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
