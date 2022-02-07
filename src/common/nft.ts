import { BigNumber, BigNumberish } from "ethers";
import { CommonNFTOutput, NFTMetadata } from "../schema/tokens/common";
import { IStorage } from "../core";
import { Provider } from "@ethersproject/providers";
import {
  ERC165__factory,
  TokenERC1155__factory,
  TokenERC721__factory,
} from "@3rdweb/contracts";
import { NotFoundError } from "./error";
import {
  InterfaceId_IERC1155,
  InterfaceId_IERC721,
} from "../constants/contract";

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
  const jsonMetadata = await storage.get(tokenUri);
  return CommonNFTOutput.parse({
    id: BigNumber.from(tokenId),
    uri: tokenUri,
    ...jsonMetadata,
  });
}

// Used for marketplace to fetch NFT metadata from contract address + tokenId
export async function fetchTokenMetadataForContract(
  contractAddress: string,
  provider: Provider,
  tokenId: string,
  storage: IStorage,
) {
  let uri: string | undefined;
  const erc165 = ERC165__factory.connect(contractAddress, provider);
  const isERC721 = await erc165.supportsInterface(InterfaceId_IERC721);
  const isERC1155 = await erc165.supportsInterface(InterfaceId_IERC1155);
  if (isERC721) {
    const erc721 = TokenERC721__factory.connect(contractAddress, provider);
    uri = await erc721.tokenURI(tokenId);
  } else if (isERC1155) {
    const erc1155 = TokenERC1155__factory.connect(contractAddress, provider);
    uri = await erc1155.uri(tokenId);
  } else {
    throw Error("Contract must implement ERC 1155 or ERC 721.");
  }
  if (!uri) {
    throw new NotFoundError();
  }
  return fetchTokenMetadata(tokenId, uri, storage);
}
