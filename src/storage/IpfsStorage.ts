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
    signerAddress?: string,
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  public async getUploadToken(): Promise<string> {
    throw new Error("Method not implemented.");
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
  private resolveFullUrl(ipfsHash: string): string {
    return ipfsHash.replace("ipfs://", this.gatewayUrl);
  }
}
