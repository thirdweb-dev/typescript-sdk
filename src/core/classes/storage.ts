import { JsonObject } from "..";
import { FileOrBuffer } from "../..";
import { IStorage } from "../interfaces/IStorage";

export class Storage {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  public async fetch(hash: string): Promise<Record<string, any>> {
    return this.storage.get(hash);
  }

  public async upload(data: FileOrBuffer[] | JsonObject[]): Promise<string> {
    const allFiles = (data as any[]).filter(
      (item: any) => item instanceof File || item instanceof Buffer,
    );
    const allObjects = (data as any[]).filter(
      (item: any) => !(item instanceof File) && !(item instanceof Buffer),
    );
    if (allFiles) {
      return this.storage.uploadBatch(data as FileOrBuffer[]);
    } else if (allObjects) {
      const { baseUri } = await this.storage.uploadMetadataBatch(
        data as JsonObject[],
      );
      return baseUri;
    } else {
      throw new Error(
        "Data to upload must be either all files or all JSON objects",
      );
    }
  }
}
