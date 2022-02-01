import { ContractWrapper } from "./contract-wrapper";
import { DropERC721, TokenERC721 } from "@3rdweb/contracts";
import { BigNumber, BigNumberish } from "ethers";
import {
  CommonNFTOutput,
  NFTMetadata,
  NFTMetadataOwner,
} from "../../schema/tokens/common";
import { AddressZero } from "@ethersproject/constants";
import {
  DEFAULT_QUERY_ALL_COUNT,
  QueryAllParams,
} from "../../types/QueryParams";
import { IStorage } from "../interfaces";
import { NetworkOrSignerOrProvider, TransactionResultPromise } from "../types";
import { NotFoundError, RestrictedTransferError } from "../../common";
import { UpdateableNetwork } from "../interfaces/module";
import { SDKOptions, SDKOptionsSchema } from "../../schema/sdk-options";

export class Erc721<T extends DropERC721 | TokenERC721>
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
        "invalid module options object passed, falling back to default options",
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

  public getAddress(): string {
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
   * const nft = await module.get("0");
   * console.log(nft);
   * ```
   * @param tokenId - the tokenId of the NFT to retrieve
   * @returns The NFT metadata
   */
  public async get(tokenId: BigNumberish): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId).catch(() => AddressZero),
      this.getTokenMetadata(tokenId),
    ]);
    return { owner, metadata };
  }

  /**
   * Get All NFTs
   *
   * @remarks Get all the data associated with every NFT in this module.
   *
   * @example
   * ```javascript
   * const nfts = await module.getAll();
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
      (await this.contractWrapper.readContract.nextTokenIdToMint()).toNumber(),
      start + count,
    );
    return await Promise.all(
      Array.from(Array(maxId - start).keys()).map((i) =>
        this.get((start + i).toString()),
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
   * const nfts = await module.getOwned(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the module.
   */
  public async getOwned(_address?: string): Promise<NFTMetadataOwner[]> {
    const address = _address
      ? _address
      : await this.contractWrapper.getSignerAddress();
    const balance = await this.contractWrapper.readContract.balanceOf(address);
    const indices = Array.from(Array(balance.toNumber()).keys());
    const tokenIds = await Promise.all(
      indices.map((i) =>
        this.contractWrapper.readContract.tokenOfOwnerByIndex(address, i),
      ),
    );
    return await Promise.all(
      tokenIds.map((tokenId) => this.get(tokenId.toString())),
    );
  }

  /**
   * Get the current owner of a given NFT within this Module
   *
   * @param tokenId - the tokenId of the NFT
   * @returns the address of the owner
   */
  public async ownerOf(tokenId: BigNumberish): Promise<string> {
    return await this.contractWrapper.readContract.ownerOf(tokenId);
  }

  /**
   * Get the total supply for this Module.
   *
   * @returns the total supply
   */
  public async totalSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.nextTokenIdToMint();
  }

  /**
   * Get NFT Balance
   *
   * @remarks Get a wallets NFT balance (number of NFTs in this module owned by the wallet).
   *
   * @example
   * ```javascript
   * // Address of the wallet to check NFT balance
   * const address = "{{wallet_address}}";
   *
   * const balance = await module.balanceOf(address);
   * console.log(balance);
   * ```
   */
  public async balanceOf(address: string): Promise<BigNumber> {
    return await this.contractWrapper.readContract.balanceOf(address);
  }

  /**
   * Get NFT Balance for the currently connected wallet
   */
  public async balance(): Promise<BigNumber> {
    return await this.balanceOf(await this.contractWrapper.getSignerAddress());
  }

  /**
   * Get whether users can transfer NFTs from this module
   */
  public async isTransferRestricted(): Promise<boolean> {
    return this.contractWrapper.readContract.isTransferRestricted();
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
   *
   * await module.transfer(toAddress, tokenId);
   * ```
   */
  public async transfer(to: string, tokenId: string): TransactionResultPromise {
    if (await this.isTransferRestricted()) {
      throw new RestrictedTransferError(
        await this.contractWrapper.getSignerAddress(),
      );
    }
    const from = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "safeTransferFrom(address,address,uint256)",
        [from, to, tokenId],
      ),
    };
  }

  /**
   * Burn a single NFT
   * @param tokenId - the token Id to burn
   */
  public async burn(tokenId: BigNumberish): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [tokenId]),
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
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("setApprovalForAll", [
        operator,
        approved,
      ]),
    };
  }

  /**
   * Set whether NFTs in this Module can be transferred or not.
   * @param restricted whether to restrict or allow transfers
   */
  public async setRestrictedTransfer(
    restricted = false,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "setRestrictedTransfer",
        [restricted],
      ),
    };
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  protected async getTokenMetadata(
    tokenId: BigNumberish,
  ): Promise<NFTMetadata> {
    const tokenUri = await this.contractWrapper.readContract.tokenURI(tokenId);
    if (!tokenUri) {
      throw new NotFoundError();
    }
    // TODO: include recursive metadata IPFS resolving for all
    // properties with a hash
    const jsonMetadata = JSON.parse(await this.storage.get(tokenUri));
    return CommonNFTOutput.parse({
      id: BigNumber.from(tokenId),
      uri: tokenUri,
      ...jsonMetadata,
    });
  }
}
