import { FileOrBuffer, JsonObject } from "../../src/core/types";
import { v4 as uuidv4 } from "uuid";
import { IStorage, NotFoundError, UploadMetadataBatchResult } from "../../src";

export class MockStorage implements IStorage {
  private objects: { [key: string]: any } = {};
  private folders: { [cid: string]: { [id: string]: any } } = {};

  public async upload(
    data: string | FileOrBuffer,
    _contractAddress?: string,
    _signerAddress?: string,
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
    files: (string | FileOrBuffer)[],
    fileStartNumber?: number,
    _contractAddress?: string,
    _signerAddress?: string,
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
        const name = file.name ? file.name : `file_${index}`;
        this.folders.cid[name] = contents;
        continue;
      }
      this.folders[cid][index.toString()] = contents;

      index += 1;
    }

    return Promise.resolve(`mock://${cid}`);
  }

  public async getUploadToken(_contractAddress: string): Promise<string> {
    return Promise.resolve("mock-token");
  }

  get(hash: string): Promise<Record<string, any>> {
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
    return Promise.resolve(JSON.parse(this.folders[cid][index.toString()]));
  }

  public async uploadMetadata(
    metadata: JsonObject,
    contractAddress?: string,
    _signerAddress?: string,
  ): Promise<string> {
    // since there's only single object, always use the first index
    const { metadataUris } = await this.uploadMetadataBatch(
      [metadata],
      0,
      contractAddress,
    );

    return metadataUris[0];
  }

  public async uploadMetadataBatch(
    metadatas: JsonObject[],
    fileStartNumber?: number,
    contractAddress?: string,
    signerAddress?: string,
  ): Promise<UploadMetadataBatchResult> {
    await this.batchUploadProperties(metadatas);

    const metadataToUpload: string[] = metadatas.map((m: any) =>
      JSON.stringify(m),
    );

    const cid = await this.uploadBatch(
      metadataToUpload,
      fileStartNumber,
      contractAddress,
      signerAddress,
    );
    const baseUri = `${cid}/`;
    return {
      metadataUris: metadataToUpload.map((_, i) => `${baseUri}${i}`),
      baseUri,
    };
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
        await this.uploadProperties(val);
      }
    }
  }

  private async batchUploadProperties(metadatas: JsonObject[]): Promise<any> {
    for (const file of metadatas) {
      if (typeof file === "string") {
        continue;
      }
      await this.uploadProperties(file);
    }
  }
}
