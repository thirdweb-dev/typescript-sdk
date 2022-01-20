import { DEFAULT_IPFS_GATEWAY, TW_IPFS_SERVER_URL } from "../constants/urls";
import { UploadError } from "./error";

if (!global.FormData) {
  global.FormData = require("form-data");
}
if (!global.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.File = require("@web-std/file").File;
}

/**
 *
 * @param ipfsUrl - the ipfs:// uri
 * @param gatewayUrl - the gateway url
 * @returns the fully formed IPFS url
 * @internal
 */
export function replaceIpfsWithGateway(
  ipfsUrl: string,
  gatewayUrl: string = DEFAULT_IPFS_GATEWAY,
) {
  if (!ipfsUrl || typeof ipfsUrl !== "string") {
    return "";
  }
  if (!gatewayUrl.endsWith("/")) {
    gatewayUrl = `${gatewayUrl}/`;
  }
  return ipfsUrl.replace("ipfs://", gatewayUrl);
}
export function recursiveResolveGatewayUrl(
  json: any,
  ipfsGatewayUrl: string = DEFAULT_IPFS_GATEWAY,
) {
  if (typeof json === "object") {
    const keylist = Object.keys(json);
    keylist.forEach((key: string) => {
      if (typeof json[key] === "object") {
        json[key] = recursiveResolveGatewayUrl(json[key], ipfsGatewayUrl);
      } else if (
        typeof json[key] === "string" &&
        json[key].startsWith("ipfs://")
      ) {
        json[key] = replaceIpfsWithGateway(json[key], ipfsGatewayUrl);
      }
    });
  }
  return json;
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
  data: string | File | Buffer,
  contractAddress?: string,
  signerAddress?: string,
): Promise<string> {
  const headers = {
    "X-App-Name": `CONSOLE-TS-SDK-${contractAddress}`,
    "X-Public-Address": signerAddress || "",
  };
  const formData = new FormData();
  formData.append("file", data as any);
  const res = await fetch(TW_IPFS_SERVER_URL, {
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
export async function uploadMetadata<TMetadata>(
  metadata: TMetadata,
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
