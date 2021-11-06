import { LazyNFT, NFT, NFTCollection } from "@3rdweb/contracts";
import { Contract } from "@ethersproject/contracts";
import { JSONValue, ProviderOrSigner } from "../core/types";
import { NotFoundError } from "./error";
import { replaceIpfsWithGateway } from "./ipfs";

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

/**
 * The shared NFT metadata.
 * @public
 */
export interface NFTMetadata {
  id: string;
  uri: string;
  name?: string;
  description?: string;
  image?: string;
  properties?: Record<string, JSONValue>;
}

/**
 * The shared NFT metadata, including the current owner address.
 * @public
 */
export interface NFTMetadataOwner {
  owner: string;
  metadata: NFTMetadata;
}

/**
 * @internal
 */
export type NFTContractTypes = NFT | NFTCollection | LazyNFT;

/**
/* @internal
 */
export async function getMetadataWithoutContract(
  provider: ProviderOrSigner,
  contractAddress: string,
  tokenId: string,
  ipfsGatewayUrl: string,
): Promise<NFTMetadata> {
  const contract = new Contract(contractAddress, tokenUriABI, provider) as NFT;
  return getTokenMetadata(contract, tokenId, ipfsGatewayUrl);
}

/**
/* @internal
 */
export async function getTokenMetadata(
  contract: NFTContractTypes,
  tokenId: string,
  ipfsGatewayUrl: string,
): Promise<NFTMetadata> {
  const uri = await getTokenUri(contract, tokenId);
  if (!uri) {
    throw new NotFoundError();
  }
  const gatewayUrl = replaceIpfsWithGateway(uri, ipfsGatewayUrl);
  const meta = await fetch(gatewayUrl);
  const metadata = await meta.json();
  const entity: NFTMetadata = {
    ...metadata,
    id: tokenId,
    uri,
    image: replaceIpfsWithGateway(metadata.image, ipfsGatewayUrl),
  };
  return entity;
}

/**
/* @internal
 */
export async function getTokenUri(
  contract: NFTContractTypes,
  tokenId: string,
): Promise<string> {
  let uri = "";
  try {
    uri = await contract.tokenURI(tokenId);
    // eslint-disable-next-line no-empty
  } catch (e) {}

  if (!uri) {
    try {
      uri = await (contract as NFTCollection).uri(tokenId);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  return uri;
}
