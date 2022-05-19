import { BigNumber, BigNumberish, Contract, providers } from "ethers";
import {
  CommonNFTInput,
  CommonNFTOutput,
  NFTMetadata,
  NFTMetadataInput,
  NFTMetadataOrUri,
} from "../schema/tokens/common";
import { IStorage } from "../core";
import { IERC1155Metadata, IERC165, IERC721Metadata } from "contracts";
import { NotFoundError } from "./error";
import {
  InterfaceId_IERC1155,
  InterfaceId_IERC721,
} from "../constants/contract";
import ERC721MetadataAbi from "../../abis/IERC721Metadata.json";
import ERC1155MetadataAbi from "../../abis/IERC1155Metadata.json";
import ERC165MetadataAbi from "../../abis/IERC165.json";

/**
 * fetches the token metadata
 * @param tokenId - the id (to get it back in the output)
 * @param tokenUri - the uri to fetch
 * @param storage - which storage to fetch from
 *
 * @internal
 */
export async function fetchTokenMetadata(
  tokenId: BigNumberish,
  tokenUri: string,
  storage: IStorage,
): Promise<NFTMetadata> {
  const parsedUri = tokenUri.replace(
    "{id}",
    BigNumber.from(tokenId).toHexString().slice(2),
  );
  const jsonMetadata = await storage.get(parsedUri);
  return CommonNFTOutput.parse({
    id: BigNumber.from(tokenId),
    uri: tokenUri,
    ...jsonMetadata,
  });
}

// Used for marketplace to fetch NFT metadata from contract address + tokenId
/**
 * @internal
 * @param contractAddress
 * @param provider
 * @param tokenId
 * @param storage
 */
export async function fetchTokenMetadataForContract(
  contractAddress: string,
  provider: providers.Provider,
  tokenId: BigNumberish,
  storage: IStorage,
) {
  let uri: string | undefined;
  const erc165 = new Contract(
    contractAddress,
    ERC165MetadataAbi,
    provider,
  ) as IERC165;
  const isERC721 = await erc165.supportsInterface(InterfaceId_IERC721);
  const isERC1155 = await erc165.supportsInterface(InterfaceId_IERC1155);
  if (isERC721) {
    const erc721 = new Contract(
      contractAddress,
      ERC721MetadataAbi,
      provider,
    ) as IERC721Metadata;
    uri = await erc721.tokenURI(tokenId);
  } else if (isERC1155) {
    const erc1155 = new Contract(
      contractAddress,
      ERC1155MetadataAbi,
      provider,
    ) as IERC1155Metadata;
    uri = await erc1155.uri(tokenId);
  } else {
    throw Error("Contract must implement ERC 1155 or ERC 721.");
  }
  if (!uri) {
    throw new NotFoundError();
  }
  return fetchTokenMetadata(tokenId, uri, storage);
}

/**
 * @internal
 * @param metadata
 * @param storage
 */
export async function uploadOrExtractURI(
  metadata: NFTMetadataOrUri,
  storage: IStorage,
): Promise<string> {
  if (typeof metadata === "string") {
    return metadata;
  } else {
    return await storage.uploadMetadata(CommonNFTInput.parse(metadata));
  }
}

/**
 * @internal
 * @param metadatas
 * @param storage
 */
export async function uploadOrExtractURIs(
  metadatas: NFTMetadataOrUri[],
  storage: IStorage,
): Promise<string[]> {
  if (isUriList(metadatas)) {
    return metadatas;
  } else if (isMetadataList(metadatas)) {
    const { metadataUris } = await storage.uploadMetadataBatch(
      metadatas.map((m) => CommonNFTInput.parse(m)),
    );
    return metadataUris;
  } else {
    throw new Error(
      "NFT metadatas must all be of the same type (all URI or all NFTMetadataInput)",
    );
  }
}

function isUriList(metadatas: NFTMetadataOrUri[]): metadatas is string[] {
  return metadatas.find((m) => typeof m !== "string") === undefined;
}

function isMetadataList(
  metadatas: NFTMetadataOrUri[],
): metadatas is NFTMetadataInput[] {
  return metadatas.find((m) => typeof m !== "object") === undefined;
}
