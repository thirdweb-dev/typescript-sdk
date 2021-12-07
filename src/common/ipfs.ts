import { MetadataURIOrObject } from "../core/types";
import FileOrBuffer from "../types/FileOrBuffer";
import { UploadError } from "./error";
import { createReadStream, readdirSync } from "fs";
import { File as FilePoly } from "web-file-polyfill";

if (!globalThis.FormData) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.FormData = require("form-data");
}

if (!globalThis.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.File = FilePoly;
}

/**
 *
 * @param ipfsUrl - the ipfs:// uri
 * @param gatewayUrl - the gateway url
 * @returns the fully formed IPFS url
 * @internal
 */
export function replaceIpfsWithGateway(ipfsUrl: string, gatewayUrl: string) {
  if (!ipfsUrl || typeof ipfsUrl !== "string") {
    return "";
  }
  if (!gatewayUrl.endsWith("/")) {
    gatewayUrl = `${gatewayUrl}/`;
  }
  return ipfsUrl.replace("ipfs://", gatewayUrl);
}

/**
 * A helper function to upload arbitrary data to IPFS and return the resulting IPFS uri.
 * @param data - stringified JSON || File
 * @param contractAddress - (Optional) the contract address to associate the data with
 * @param signerAddress - (Optional) the wallet address of the actor that is uploading the file
 * @returns The `ipfs://<hash>` uri of the uploaded file
 * @public
 */
export async function uploadToIPFS(
  data: string | File | FileOrBuffer,
  contractAddress?: string,
  signerAddress?: string,
): Promise<string> {
  const headers = {
    "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    "X-Public-Address": signerAddress || "",
  };
  const formData = new FormData();
  formData.append("file", data as any);
  const res = await fetch("https://upload.nftlabs.co/upload", {
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

/**
 * @internal
 */
export async function uploadMetadata(
  metadata: MetadataURIOrObject,
  contractAddress?: string,
  signerAddress?: string,
): Promise<string> {
  if (typeof metadata === "string") {
    return metadata;
  }
  async function _fileHandler(object: any) {
    const keys = Object.keys(object);
    for (const key in keys) {
      const val = object[keys[key]];
      const shouldUpload = val instanceof File || val instanceof Buffer;

      if (shouldUpload) {
        object[keys[key]] = await uploadToIPFS(
          object[keys[key]],
          contractAddress,
          signerAddress,
        );
      }
      if (shouldUpload && typeof object[keys[key]] !== "string") {
        throw new Error("Upload to IPFS failed");
      }
      if (typeof val === "object") {
        object[keys[key]] = await _fileHandler(object[keys[key]]);
      }
    }
    return object;
  }

  metadata = await _fileHandler(metadata);

  return await uploadToIPFS(
    JSON.stringify(metadata),
    contractAddress,
    signerAddress,
  );
}

export async function batchUpload(
  directory: string,
  contractAddress?: string,
): Promise<string> {
  const headers = {
    "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
  };
  const key = process.env.PINATA_API_KEY;
  const secret = process.env.PINATA_API_SECRET;
  let jwt = process.env.PINATA_API_JWT;
  if (!key || !secret) {
    await fetch("https://upload.nftlabs.co/grant", {
      method: "GET",
      headers,
    }).then(async (res) => {
      const body = await res.json();
      jwt = body;
    });
  }
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const files = readdirSync(directory);
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
      createReadStream(`${directory}/${file}`) as unknown as Blob,
      { filepath: `files/${file}` } as unknown as string,
    );
  });
  console.log(`Uploading ${files.length} files to IPFS`);
  const metadata = {
    name: `CONSOLE-TS-SDK-${contractAddress}`,
  };

  data.append("pinataMetadata", JSON.stringify(metadata));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data.getBoundary()}`,
      Authorization: `Bearer ${jwt}`,
    },
    body: data,
  })
    .then((response) => {
      // console.log(response.body);
      return response;
    })
    .catch((err: any) => {
      throw new UploadError(`Failed to upload to IPFS: ${err}`);
    });

  return (await res.json()).IpfsHash;
}

export async function batchUploadMetadata(
  directory: string,
  contractAddress?: string,
): Promise<MetadataURIOrObject[]> {
  const ipfsUri = await batchUpload(directory, contractAddress);
  const files = readdirSync(directory);
  const metadatas = [];
  for (let i = 1; i < files.length + 1; i++) {
    metadatas.push(`ipfs://${ipfsUri}/${i}.json`);
  }
  return metadatas;
}
