import { BigNumber, BigNumberish } from "ethers";
import { CommonNFTOutput, NFTMetadata } from "../schema/tokens/common";
import { IStorage } from "../core";

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
  // TODO: include recursive metadata IPFS resolving for all
  // properties with a hash
  const jsonMetadata = JSON.parse(await storage.get(tokenUri));
  return CommonNFTOutput.parse({
    id: BigNumber.from(tokenId),
    uri: tokenUri,
    ...jsonMetadata,
  });
}
