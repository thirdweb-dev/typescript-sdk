import { ContractWrapper } from "./contract-wrapper";
import { IERC1155Enumerable } from "contracts";
import { BigNumber } from "ethers";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../../types";
import { EditionMetadata, EditionMetadataOwner } from "../../schema";
import { Erc1155 } from "./erc-1155";
import { BaseERC1155 } from "../../types/eips";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { FEATURE_EDITION_ENUMERABLE } from "../../constants/erc1155-features";

/**
 * List ERC1155 NFTs
 * @remarks Easily list all the NFTs in a ERC1155 contract.
 * @example
 * ```javascript
 * const contract = sdk.getContract("{{contract_address}}");
 * const nfts = await contract.edition.query.all();
 * ```
 * @public
 */
export class Erc1155Enumerable implements DetectableFeature {
  featureName = FEATURE_EDITION_ENUMERABLE.name;
  private contractWrapper: ContractWrapper<BaseERC1155 & IERC1155Enumerable>;
  private erc1155: Erc1155;

  constructor(
    erc1155: Erc1155,
    contractWrapper: ContractWrapper<BaseERC1155 & IERC1155Enumerable>,
  ) {
    this.erc1155 = erc1155;
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
   * const nfts = await contract.edition.query.all();
   * ```
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async all(queryParams?: QueryAllParams): Promise<EditionMetadata[]> {
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
        this.erc1155.get((start + i).toString()),
      ),
    );
  }

  /**
   * Get the number of NFTs minted
   * @returns the total number of NFTs minted in this contract
   * @public
   */
  public async getTotalCount(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.nextTokenIdToMint();
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
   * const nfts = await contract.edition.query.owned(address);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async owned(walletAddress?: string): Promise<EditionMetadataOwner[]> {
    const address = walletAddress
      ? walletAddress
      : await this.contractWrapper.getSignerAddress();
    const maxId = await this.contractWrapper.readContract.nextTokenIdToMint();
    const balances = await this.contractWrapper.readContract.balanceOfBatch(
      Array(maxId.toNumber()).fill(address),
      Array.from(Array(maxId.toNumber()).keys()),
    );

    const ownedBalances = balances
      .map((b, i) => {
        return {
          tokenId: i,
          balance: b,
        };
      })
      .filter((b) => b.balance.gt(0));
    return await Promise.all(
      ownedBalances.map(async (b) => {
        const editionMetadata = await this.erc1155.get(b.tokenId.toString());
        return {
          ...editionMetadata,
          owner: address,
          quantityOwned: b.balance,
        };
      }),
    );
  }
}
