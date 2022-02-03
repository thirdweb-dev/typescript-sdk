import { ContractWrapper } from "./contract-wrapper";
import { DropERC721, TokenERC20, TokenERC721 } from "@3rdweb/contracts";
import { BigNumber, BigNumberish } from "ethers";
import { NFTMetadata, NFTMetadataOwner } from "../../schema/tokens/common";
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
import { fetchTokenMetadata } from "../../common/nft";
import { Currency, CurrencyValue } from "../../types/currency";
import { fetchCurrencyMetadata } from "../../common/currency";

export class Erc20<T extends TokenERC20> implements UpdateableNetwork {
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
   * Get the token Metadata (name, symbol, etc...)
   *
   * @example
   * ```javascript
   * const token = await module.get();
   * console.log(token);
   * ```
   * @param tokenId - the tokenId of the NFT to retrieve
   * @returns The NFT metadata
   */
  public async get(): Promise<Currency> {
    return await fetchCurrencyMetadata(
      this.contractWrapper.getProvider(),
      this.getAddress(),
    );
  }

  /**
   * Get Token Balance
   *
   * @remarks Get a wallets token balance.
   *
   * @example
   * ```javascript
   * // Address of the wallet to check token balance
   * const address = "{{wallet_address}}";
   *
   * const balance = await module.balanceOf(address);
   * console.log(balance);
   * ```
   *
   * @returns The balance of a specific wallet.
   */
  public async balanceOf(address: string): Promise<CurrencyValue> {
    return await this.contractWrapper.readContract.balanceOf(address);
  }

  /**
   * Get NFT Balance for the currently connected wallet
   */
  public async balance(): Promise<CurrencyValue> {
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
   * @param restricted - restricted whether to restrict or allow transfers
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

  public async getValue(value: BigNumberish): Promise<CurrencyValue> {
    return await getCurrencyValue(
      this.providerOrSigner,
      this.address,
      BigNumber.from(value),
    );
  }
}
