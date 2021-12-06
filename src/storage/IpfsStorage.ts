import { createReadStream, readdirSync } from "fs";
import { FetchError, UploadError } from "../common/error";
import IStorage from "../interfaces/IStorage";
import { FileOrBuffer } from "../types";

if (!globalThis.FormData) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.FormData = require("form-data");
}

const thirdwebIpfsServerUrl = "https://upload.nftlabs.co/upload";

export default class IpfsStorage implements IStorage {
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
    const res = await fetch(thirdwebIpfsServerUrl, {
      method: "POST",
      body: formData as any,
      headers,
    });
    try {
      const body = await res.json();
      return body.IpfsUri;
    } catch (e) {
      throw new UploadError(`Failed to upload to IPFS: ${e}`);
    }
  }

  public async uploadFolder(
    path: string,
    contractAddress?: string,
  ): Promise<string> {
    const token = await this.getUploadToken(contractAddress || "");
    const metadata = {
      name: `CONSOLE-TS-SDK-${contractAddress}`,
    };
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const files = readdirSync(path);
    const data = new FormData() as {
      append(name: string, value: string | Blob, fileName?: string): void;
      delete(name: string): void;
      get(name: string): FormDataEntryValue | null;
      getAll(name: string): FormDataEntryValue[];
      has(name: string): boolean;
      set(name: string, value: string | Blob, fileName?: string): void;
      forEach(
        callbackfn: (
          value: FormDataEntryValue,
          key: string,
          parent: FormData,
        ) => void,
        thisArg?: any,
      ): void;
      getBoundary(): string;
    };
    files.forEach((file) => {
      data.append(
        `file`,
        createReadStream(`${path}/${file}`) as unknown as Blob,
        { filepath: `files/${file}` } as unknown as string,
      );
    });
    console.log(`Uploading ${files.length} files to IPFS`);
    data.append("pinataMetadata", JSON.stringify(metadata));
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data.getBoundary()}`,
        Authorization: `Bearer ${token}`,
      },
      body: data,
    })
      .then((response) => {
        console.log(response.body);
        return response;
      })
      .catch((err: any) => {
        throw new UploadError(`Failed to upload to IPFS: ${err}`);
      });
    return (await res.json()).IpfsHash;
  }

  public async getUploadToken(contractAddress: string): Promise<string> {
    const headers = {
      "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    };
    const res = await fetch(`${thirdwebIpfsServerUrl}/grant`, {
      method: "GET",
      headers,
    });
    try {
      const body = await res.json();
      return body.jwt;
    } catch (e) {
      throw new FetchError(`Failed to get upload token: ${e}`);
    }
  }

  public async get(hash: string): Promise<string> {
    const uri = this.resolveFullUrl(hash);
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

  /**
   * Resolves the full url for a file using the configured gateway
   *
   * @param ipfsHash - the ipfs:// uri
   * @returns - The fully formed IPFS url with the gateway url
   * @internal
   */
  resolveFullUrl(ipfsHash: string): string {
    return ipfsHash.replace("ipfs://", this.gatewayUrl);
  }
}
