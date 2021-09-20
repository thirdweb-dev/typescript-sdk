import { ProviderOrSigner } from "../core";
import { NotFoundError } from "./error";
import { replaceIpfsWithGateway } from "../common/ipfs";
import { Contract } from "@ethersproject/contracts";

// support erc721 and erc1155
const tokenUriABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "uri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export interface NFTMetadata {
  id: string;
  uri: string;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Record<string, any>;
}

export async function getMetadata(
  provider: ProviderOrSigner,
  contractAddress: string,
  tokenId: string,
  ipfsGatewayUrl: string,
): Promise<NFTMetadata> {
  const uri = await getMetadataUri(provider, contractAddress, tokenId); // contract.uri(tokenId);
  if (!uri) {
    throw new NotFoundError();
  }
  const gatewayUrl = replaceIpfsWithGateway(uri, ipfsGatewayUrl);
  const meta = await fetch(gatewayUrl);
  const metadata = await meta.json();
  const entity: NFTMetadata = {
    ...metadata,
    id: tokenId,
    uri: uri,
    image: replaceIpfsWithGateway(metadata.image, ipfsGatewayUrl),
  };
  return entity;
}

export async function getMetadataUri(
  provider: ProviderOrSigner,
  contractAddress: string,
  tokenId: string,
): Promise<string> {
  const contract = new Contract(contractAddress, tokenUriABI, provider);

  let uri = "";
  try {
    uri = await contract.tokenURI(tokenId);
  } catch (e) {}

  if (!uri) {
    try {
      uri = await contract.uri(tokenId);
    } catch (e) {}
  }

  return uri;
}
