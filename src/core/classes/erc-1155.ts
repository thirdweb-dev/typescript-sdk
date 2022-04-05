import { ContractWrapper } from "./contract-wrapper";
import { DropERC1155, TokenERC1155 } from "@thirdweb-dev/contracts";
import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { NFTMetadata } from "../../schema/tokens/common";
import { IStorage } from "../interfaces";
import { NetworkOrSignerOrProvider, TransactionResult } from "../types";
import { UpdateableNetwork } from "../interfaces/contract";
import { SDKOptions, SDKOptionsSchema } from "../../schema/sdk-options";
import {
  EditionMetadata,
  EditionMetadataOutputSchema,
  EditionMetadataOwner,
} from "../../schema/tokens/edition";
import { fetchTokenMetadata } from "../../common/nft";
import { AddressZero } from "@ethersproject/constants";
import { getRoleHash } from "../../common/role";
import { NotFoundError } from "../../common";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../../types";

/**
 * Standard ERC1155 functions
 * @public
 */
export class Erc1155<T extends DropERC1155 | TokenERC1155>
  implements UpdateableNetwork
{
  protected contractWrapper: ContractWrapper<T>;
  protected storage: IStorage;
  protected options: SDKOptions;

  constructor(
    contractWrapper: ContractWrapper<T>,
    storage: IStorage,
    options: SDKOptions = {},
  ) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
    try {
      this.options = SDKOptionsSchema.parse(options);
    } catch (optionParseError) {
      console.error(
        "invalid contract options object passed, falling back to default options",
        optionParseError,
      );
      this.options = SDKOptionsSchema.parse({});
    }
  }

  /**
   * @internal
   */
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * Get a single NFT Metadata
   *
   * @example
   * ```javascript
   * const nft = await contract.get("0");
   * console.log(nft);
   * ```
   * @param tokenId - the tokenId of the NFT to retrieve
   * @returns The NFT metadata
   */
  public async get(tokenId: BigNumberish): Promise<EditionMetadata> {
    const [supply, metadata] = await Promise.all([
      this.contractWrapper.readContract
        .totalSupply(tokenId)
        .catch(() => BigNumber.from(0)),
      this.getTokenMetadata(tokenId),
    ]);
    return EditionMetadataOutputSchema.parse({
      supply,
      metadata,
    });
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
  ): Promise<EditionMetadata[]> {
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
        this.get((start + i).toString()),
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
   * const nfts = await contract.getOwned(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async getOwned(_address?: string): Promise<EditionMetadataOwner[]> {
    const address = _address
      ? _address
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
        const editionMetadata = await this.get(b.tokenId.toString());
        return {
          ...editionMetadata,
          owner: address,
          quantityOwned: b.balance,
        };
      }),
    );
  }

  /**
   * Returns the total supply of a specific token
   * @param tokenId - The token ID to get the total supply of
   * @returns the total supply
   */
  public async totalSupply(tokenId: BigNumberish): Promise<BigNumber> {
    return await this.contractWrapper.readContract.totalSupply(tokenId);
  }

  /**
   * Get NFT Balance
   *
   * @remarks Get a wallets NFT balance (number of NFTs in this contract owned by the wallet).
   *
   * @example
   * ```javascript
   * // Address of the wallet to check NFT balance
   * const address = "{{wallet_address}}";
   * // Id of the NFT to check
   * const tokenId = 0;
   *
   * const balance = await contract.balanceOf(address, tokenId);
   * console.log(balance);
   * ```
   */
  public async balanceOf(
    address: string,
    tokenId: BigNumberish,
  ): Promise<BigNumber> {
    return await this.contractWrapper.readContract.balanceOf(address, tokenId);
  }

  /**
   * Get NFT Balance for the currently connected wallet
   */
  public async balance(tokenId: BigNumberish): Promise<BigNumber> {
    return await this.balanceOf(
      await this.contractWrapper.getSignerAddress(),
      tokenId,
    );
  }

  /**
   * Get whether users can transfer NFTs from this contract
   */
  public async isTransferRestricted(): Promise<boolean> {
    const anyoneCanTransfer = await this.contractWrapper.readContract.hasRole(
      getRoleHash("transfer"),
      AddressZero,
    );
    return !anyoneCanTransfer;
  }

  /**
   * Get whether this wallet has approved transfers from the given operator
   * @param address - the wallet address
   * @param operator - the operator address
   */
  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.contractWrapper.readContract.isApprovedForAll(
      address,
      operator,
    );
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Transfer a single NFT
   *
   * @remarks Transfer an NFT from the connected wallet to another wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to send the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // The token ID of the NFT you want to send
   * const tokenId = "0";
   * // How many copies of the NFTs to transfer
   * const amount = 3;
   *
   * await contract.transfer(toAddress, tokenId, amount);
   * ```
   */
  public async transfer(
    to: string,
    tokenId: BigNumberish,
    amount: BigNumberish,
    data: BytesLike = [0],
  ): Promise<TransactionResult> {
    const from = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction("safeTransferFrom", [
        from,
        to,
        tokenId,
        amount,
        data,
      ]),
    };
  }

  /**
   * Burn a single NFT
   * @param tokenId - the token Id to burn
   */
  public async burn(
    tokenId: BigNumberish,
    amount: BigNumberish,
  ): Promise<TransactionResult> {
    const account = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [
        account,
        tokenId,
        amount,
      ]),
    };
  }

  /**
   * Approve or remove operator as an operator for the caller. Operators can call transferFrom or safeTransferFrom for any token owned by the caller.
   * @param operator - the operator's address
   * @param approved - whether to approve or remove
   *
   * @internal
   */
  public async setApprovalForAll(
    operator: string,
    approved: boolean,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("setApprovalForAll", [
        operator,
        approved,
      ]),
    };
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * @internal
   * @param tokenId - the token Id to fetch
   */
  protected async getTokenMetadata(
    tokenId: BigNumberish,
  ): Promise<NFTMetadata> {
    const tokenUri = await this.contractWrapper.readContract.uri(tokenId);
    if (!tokenUri) {
      throw new NotFoundError();
    }
    return fetchTokenMetadata(tokenId, tokenUri, this.storage);
  }
}
