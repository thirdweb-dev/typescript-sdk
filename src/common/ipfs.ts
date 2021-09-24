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
export async function uploadMetadata(
  metadata: string | Record<string, JSONValue>,
  contractAddress?: string,
  signerAddress?: string,
): Promise<string> {
  if (typeof metadata === "string") {
    return metadata;
  }

  const headers = {
    "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    "X-Public-Address": signerAddress || "",
  };

  const formData = new FormData();
  formData.append("file", JSON.stringify(metadata));
  const res = await fetch("https://upload.nftlabs.co/upload", {
    method: "POST",
    body: formData,
    headers,
  });

  const body = await res.json();
  return body.IpfsUri;
}
