import { ContractWrapper } from "./contract-wrapper";
import {
  ERC721,
  ERC721Enumerable,
  ERC721Metadata,
} from "@thirdweb-dev/contracts";
import { BigNumber, BigNumberish } from "ethers";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../../types";
import { NFTMetadata, NFTMetadataOwner } from "../../schema";
import { NotFoundError } from "../../common";
import { fetchTokenMetadata } from "../../common/nft";
import { IStorage } from "../interfaces";
import { Erc721 } from "./erc-721";

export class Erc721Enumerable<
  TContract extends ERC721Enumerable & ERC721Metadata & ERC721,
> {
  private contractWrapper: ContractWrapper<TContract>;
  private storage: IStorage;
  private erc721: Erc721<ERC721Metadata & ERC721>;

  constructor(
    erc721: Erc721<ERC721Metadata & ERC721>,
    contractWrapper: ContractWrapper<TContract>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
    this.storage = storage;
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
  public async getAll(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = Math.min(
      (await this.getTotalCount()).toNumber(),
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
  public async getOwned(_address?: string): Promise<NFTMetadataOwner[]> {
    const tokenIds = await this.getTokenIds(_address);
    return await Promise.all(
      tokenIds.map((tokenId) => this.erc721.get(tokenId.toString())),
    );
  }

  /**
   * Get the number of NFTs minted
   * @returns the total number of NFTs minted in this contract
   * @public
   */
  public async getTotalCount(): Promise<BigNumber> {
    return this.totalSupply();
  }

  /**
   * Get the total supply for this Contract.
   *
   * @returns the total supply
   */
  public async totalSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.totalSupply();
  }

  /**
   * Get all token ids of NFTs owned by a specific wallet.
   * @param _address - the wallet address to query, defaults to the connected wallet
   */
  public async getTokenIds(_address?: string): Promise<BigNumber[]> {
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

  /**
   * @internal
   */
  protected async getTokenMetadata(
    tokenId: BigNumberish,
  ): Promise<NFTMetadata> {
    const tokenUri = await this.contractWrapper.readContract.tokenURI(tokenId);
    if (!tokenUri) {
      throw new NotFoundError();
    }
    return fetchTokenMetadata(tokenId, tokenUri, this.storage);
  }
}
