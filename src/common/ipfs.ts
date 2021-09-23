export function replaceIpfsWithGateway(ipfsUrl: string, gatewayUrl: string) {
  if (!ipfsUrl) return "";
  if (!gatewayUrl.endsWith("/")) gatewayUrl = gatewayUrl + "/";
  return ipfsUrl.replace("ipfs://", gatewayUrl);
}

export function uploadJson() {}
