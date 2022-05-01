import { ContractWrapper } from "./contract-wrapper";
import {
  ERC721Enumerable,
  ERC721Enumerable__factory,
  ERC721Supply,
} from "contracts";
import { BigNumber } from "ethers";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../../types";
import { NFTMetadataOwner } from "../../schema";
import { Erc721 } from "./erc-721";
import { BaseERC721 } from "../../types/eips";
import { implementsInterface } from "../../common";
import { Erc721Enumerable } from "./erc-721-enumerable";

export class Erc721Supply {
  private contractWrapper: ContractWrapper<BaseERC721 & ERC721Supply>;
  private erc721: Erc721<BaseERC721>;

  public owned: Erc721Enumerable | undefined;

  constructor(
    erc721: Erc721<BaseERC721>,
    contractWrapper: ContractWrapper<BaseERC721 & ERC721Supply>,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
    this.owned = this.detectErc721Owned();
  }

  /**
   * Get All Minted NFTs
   *
   * @remarks Get all the data associated with every NFT in this contract.
   *
   * By default, returns the first 100 NFTs, use queryParams to fetch more.
   *
   * @example
   * ```javascript
   * const nfts = await contract.query.all();
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
   * Get the number of NFTs minted
   * @returns the total number of NFTs minted in this contract
   * @public
   */
  public async totalSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.totalSupply();
  }

  private detectErc721Owned(): Erc721Enumerable | undefined {
    if (
      implementsInterface<BaseERC721 & ERC721Enumerable>(
        this.contractWrapper,
        ERC721Enumerable__factory.createInterface(),
      )
    ) {
      return new Erc721Enumerable(this.erc721, this.contractWrapper);
    }
    return undefined;
  }
}
