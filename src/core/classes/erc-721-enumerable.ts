import { ContractWrapper } from "./contract-wrapper";
import { ERC721Enumerable } from "contracts";
import { BigNumber } from "ethers";
import { NFTMetadataOwner } from "../../schema";
import { Erc721 } from "./erc-721";
import { BaseERC721 } from "../../types/eips";

export class Erc721Enumerable {
  private contractWrapper: ContractWrapper<BaseERC721 & ERC721Enumerable>;
  private erc721: Erc721<BaseERC721>;

  constructor(
    erc721: Erc721<BaseERC721>,
    contractWrapper: ContractWrapper<BaseERC721 & ERC721Enumerable>,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
  }

  /**
   * Get Owned NFTs
   *
   * @remarks Get all the data associated with the NFTs owned by a specific wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet to get the NFTs of
   * const address = "{{wallet_address}}";
   * const nfts = await contract.query.owned.all(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async all(walletAddress?: string): Promise<NFTMetadataOwner[]> {
    const tokenIds = await this.tokenIds(walletAddress);
    return await Promise.all(
      tokenIds.map((tokenId) => this.erc721.get(tokenId.toString())),
    );
  }

  /**
   * Get all token ids of NFTs owned by a specific wallet.
   * @param walletAddress - the wallet address to query, defaults to the connected wallet
   */
  public async tokenIds(walletAddress?: string): Promise<BigNumber[]> {
    const address = walletAddress
      ? walletAddress
      : await this.contractWrapper.getSignerAddress();
    const balance = await this.contractWrapper.readContract.balanceOf(address);
    const indices = Array.from(Array(balance.toNumber()).keys());
    return await Promise.all(
      indices.map((i) =>
        this.contractWrapper.readContract.tokenOfOwnerByIndex(address, i),
      ),
    );
  }
}
