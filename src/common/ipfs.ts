import { File } from "@web-std/file";
import { JSONValue } from "../core/types";

/**
 *
 * @param ipfsUrl - the ipfs:// uri
 * @param gatewayUrl - the gateway url
 * @returns the fully formed IPFS url
 * @internal
 */
export function replaceIpfsWithGateway(ipfsUrl: string, gatewayUrl: string) {
  if (!ipfsUrl) {
    return "";
  }
  if (!gatewayUrl.endsWith("/")) {
    gatewayUrl = `${gatewayUrl}/`;
  }
  return ipfsUrl.replace("ipfs://", gatewayUrl);
}

/**
 * @internal
 */
async function uploadData(
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
    body: formData,
    headers,
  });

  const body = await res.json();
  return body.IpfsUri;
}

/**
 * @internal
 */
export async function uploadMetadata(
  metadata: string | Record<string, JSONValue | File>,
  contractAddress?: string,
  signerAddress?: string,
): Promise<string> {
  if (typeof metadata === "string") {
    return metadata;
  }
  const keys = Object.keys(uploadData);

  for (const key of keys) {
    const item = metadata[key];
    if (item instanceof File) {
      // if the element is a File type => upload it and return set the resulting uri on the same key
      metadata[key] = await uploadData(item, contractAddress, signerAddress);
    }
  }

  return await uploadData(
    JSON.stringify(metadata),
    contractAddress,
    signerAddress,
  );
}
