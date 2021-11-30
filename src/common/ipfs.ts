import { MetadataURIOrObject } from "../core/types";
import { UploadError } from "./error";
import axios from "axios";
import {createReadStream,readdirSync } from "fs";

if (!globalThis.FormData) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.FormData = require("form-data");
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
  data: string | File,
  contractAddress?: string,
  signerAddress?: string,
): Promise<string> {
  const headers = {
    "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    "X-Public-Address": signerAddress || "",
  };
  const formData = new FormData();
  formData.append("file", data);
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
  var key = process.env.PINATA_API_KEY;
  var secret = process.env.PINATA_API_SECRET;
  if (!key || !secret) {
    await axios.get("http://localhost:3002/grant", { headers }).then((res) => {
      key = res.data.key;
      secret = res.data.secret;
    });
  }
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    const files = readdirSync(directory);
    let data = new FormData();
    files.forEach((file) => {
      console.log(`Adding file: ${file}`);
      data.append(`file`, createReadStream(`${directory}/${file}`) as unknown as Blob, {filepath: `files/${file}`} as unknown as string);
    });

    const metadata = {
      name: `CONSOLE-TS-SDK-${contractAddress}`
    };


    data.append("pinataMetadata", JSON.stringify(metadata));
    return await axios.post(url, data, {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          pinata_api_key: key as string,
          pinata_secret_api_key: secret as string,
        }
      })
      .then(async function (response) {
        return `ipfs://${response.data.IpfsHash}`
      })
      .catch(function (error) {
        console.log(error);
      }) as string
}
