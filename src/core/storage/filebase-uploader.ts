import { TW_FILEBASE_SERVER_URL } from "../../constants/urls";
import { FetchError } from "../../common/error";
import { CidWithFileName, IStorageUpload } from "../interfaces/IStorageUpload";
import { FileOrBuffer } from "../types";

export class FilebaseUpload implements IStorageUpload {
  public async getSignedUrl(filename: string): Promise<string> {
    const res = await fetch(`${TW_FILEBASE_SERVER_URL}/signed-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });

    if (!res.ok) {
      throw new FetchError(`Failed to get upload token`);
    }
    const url = await res.json();
    return url;
  }

  public async uploadBatchWithCid(
    files: (string | FileOrBuffer)[],
    fileStartNumber = 0,
    _contractAddress?: string,
    _signerAddress?: string,
  ): Promise<CidWithFileName> {
    // const asyncCids = ...
    files.map(async (file, i) => {
      if (typeof file === "string") {
        return file;
      }

      let filename = "";
      if (file instanceof File) {
        let extensions = "";
        if (file.name) {
          const extensionStartIndex = file.name.lastIndexOf(".");
          if (extensionStartIndex > -1) {
            extensions = file.name.substring(extensionStartIndex);
          }
        }
        filename = `${i + fileStartNumber}${extensions}`;
      } else if (file instanceof Buffer) {
        filename = `${i + fileStartNumber}`;
      } else if (file && file.name) {
        filename = `${file.name}`;
      } else {
        filename = `${i + fileStartNumber}`;
      }

      const signedUrl = await this.getSignedUrl(filename);

      // TODO: Needs to be folder upload
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file as any,
      });

      return res;
    });

    // const cids = await Promise.all(asyncCids);

    throw Error("Not implemented");
  }
}
