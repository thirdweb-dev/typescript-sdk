import { ContractWrapper } from "./contract-wrapper";
import { ERC721, ERC721Enumerable, ERC721Metadata } from "contracts";
import { BigNumber } from "ethers";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../../types";
import { NFTMetadataOwner } from "../../schema";
import { Erc721 } from "./erc-721";

export class Erc721Enumerable<
  TContract extends ERC721Enumerable & ERC721Metadata & ERC721,
> {
  private contractWrapper: ContractWrapper<TContract>;
  private erc721: Erc721<ERC721Metadata & ERC721>;

  constructor(
    erc721: Erc721<ERC721Metadata & ERC721>,
    contractWrapper: ContractWrapper<TContract>,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
  }

  /**
   * Get All NFTs
   *
   * @remarks Get all the data associated with every NFT in this contract.
   *
   * By default, returns the first 100 NFTs, use queryParams to fetch more.
   *
   * @example
   * ```javascript
   * const nfts = await contract.getAll();
   * console.log(nfts);
   * ```
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async all(queryParams?: QueryAllParams): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = Math.min(
      (await this.totalSupply()).toNumber(),
      start + count,
    );
    return await Promise.all(
      [...Array(maxId - start).keys()].map((i) =>
        this.erc721.get((start + i).toString()),
      ),
    );
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
   * const nfts = await contract.getOwned(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async owned(_address?: string): Promise<NFTMetadataOwner[]> {
    const tokenIds = await this.ownedTokenIds(_address);
    return await Promise.all(
      tokenIds.map((tokenId) => this.erc721.get(tokenId.toString())),
    );
  }

  /**
   * Get the number of NFTs minted
   * @returns the total number of NFTs minted in this contract
   * @public
   */
  public async totalSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.totalSupply();
  }

  /**
   * Get all token ids of NFTs owned by a specific wallet.
   * @param _address - the wallet address to query, defaults to the connected wallet
   */
  public async ownedTokenIds(_address?: string): Promise<BigNumber[]> {
    const address = _address
      ? _address
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
