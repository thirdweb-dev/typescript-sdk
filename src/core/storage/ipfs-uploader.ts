import { CidWithFileName, IStorageUpload } from "../interfaces/IStorageUpload";
import {
  DuplicateFileNameError,
  FetchError,
  UploadError,
} from "../../common/error";
import { FileOrBuffer } from "../types";
import { PINATA_IPFS_URL, TW_IPFS_SERVER_URL } from "../../constants/urls";
import { EventEmitter2 } from "eventemitter2";
import axios from "axios";
import { EventType } from "../../constants";

export class IpfsUploader extends EventEmitter2 implements IStorageUpload {
  /**
   * Fetches a one-time-use upload token that can used to upload
   * a file to storage.
   *
   * @returns - The one time use token that can be passed to the Pinata API.
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

  public async uploadBatchWithCid(
    files: (string | FileOrBuffer)[],
    fileStartNumber = 0,
    contractAddress?: string,
    signerAddress?: string,
    listener?: (event: { progress: number; total: number }) => void,
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

    if (listener) {
      console.log("Mounting listener...");
      this.on(EventType.UploadProgress, listener);
    }

    console.log("Preparing upload...");

    const res = await axios.post(PINATA_IPFS_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (event) => {
        console.log("UPLOADING...");
        this.emit(EventType.UploadProgress, {
          progress: event.loaded,
          total: event.total,
        });
      },
    });

    if (listener) {
      this.off(EventType.UploadProgress, listener);
    }

    if (res.status !== 200) {
      throw new UploadError("Failed to upload files to IPFS");
    }

    return {
      cid: res.data.IpfsHash,
      fileNames,
    };
  }
}
