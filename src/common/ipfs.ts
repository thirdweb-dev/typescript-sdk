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

// TODO implement
/**
 * @internal
 */
export function uploadJson() {
  throw new Error("implement me");
}
