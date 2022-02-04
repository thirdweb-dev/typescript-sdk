import { ContractWrapper } from "./contract-wrapper";
import { TokenERC20 } from "@3rdweb/contracts";
import { BigNumber, BigNumberish } from "ethers";
import { IStorage } from "../interfaces";
import { NetworkOrSignerOrProvider, TransactionResultPromise } from "../types";
import { RestrictedTransferError } from "../../common";
import { UpdateableNetwork } from "../interfaces/module";
import { SDKOptions, SDKOptionsSchema } from "../../schema/sdk-options";
import { Currency, CurrencyValue } from "../../types/currency";
import {
  fetchCurrencyMetadata,
  fetchCurrencyValue,
} from "../../common/currency";
import { TokenMintInput } from "../../schema/tokens/token";

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

  getAddress(): string {
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
   * @returns The token metadata
   */
  public async get(): Promise<Currency> {
    return await fetchCurrencyMetadata(
      this.contractWrapper.getProvider(),
      this.getAddress(),
    );
  }

  /**
   * Get Token Balance for the currently connected wallet
   *
   * @remarks Get a wallets token balance.
   *
   * @example
   * ```javascript
   * const balance = await module.balance();
   * console.log(balance);
   * ```
   *
   * @returns The balance of a specific wallet.
   */
  public async balance(): Promise<CurrencyValue> {
    return await this.balanceOf(await this.contractWrapper.getSignerAddress());
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
    return this.getValue(
      await this.contractWrapper.readContract.balanceOf(address),
    );
  }

  /**
   * The total supply for this Token
   */
  public async totalSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.totalSupply();
  }

  /**
   * Get Token Allowance
   *
   * @remarks Get the allowance of a 'spender' wallet over the connected wallet's funds - the allowance of a different address for a token is the amount of tokens that the `spender` wallet is allowed to spend on behalf of the connected wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet to check token allowance
   * const spenderAddress = "0x...";
   *
   * const allowance = await module.allowanceOf(otherAddress);
   * console.log(allowance);
   * ```
   *
   * @returns The allowance of one wallet over anothers funds.
   */
  public async allowance(spender: string): Promise<BigNumber> {
    return await this.allowanceOf(
      await this.contractWrapper.getSignerAddress(),
      spender,
    );
  }

  /**
   * Get Token Allowance
   *
   * @remarks Get the allowance of one wallet over another wallet's funds - the allowance of a different address for a token is the amount of tokens that the wallet is allowed to spend on behalf of the specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet who owns the funds
   * const address = "{{wallet_address}}";
   *
   * // Address of the wallet to check token allowance
   * const spenderAddress = "0x...";
   *
   * const allowance = await module.allowanceOf(address, spenderAddress);
   * console.log(allowance);
   * ```
   *
   * @returns The allowance of one wallet over anothers funds.
   */
  public async allowanceOf(owner: string, spender: string): Promise<BigNumber> {
    return await this.contractWrapper.readContract.allowance(owner, spender);
  }

  /**
   * Get whether users can transfer NFTs from this module
   */
  public async isTransferRestricted(): Promise<boolean> {
    return this.contractWrapper.readContract.isTransferRestricted();
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Transfer Tokens
   *
   * @remarks Transfer tokens from the connected wallet to another wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to send the tokens to
   * const toAddress = "0x...";
   *
   * // The amount of tokens you want to send
   * const amount = 0;
   *
   * await module.transfer(toAddress, amount);
   * ```
   */
  public async transfer(
    to: string,
    amount: BigNumberish,
  ): TransactionResultPromise {
    if (await this.isTransferRestricted()) {
      throw new RestrictedTransferError(this.getAddress());
    }
    return {
      receipt: await this.contractWrapper.sendTransaction("transfer", [
        to,
        amount,
      ]),
    };
  }

  /**
   * Transfer Tokens From Address
   *
   * @remarks Transfer tokens from one wallet to another
   *
   * @example
   * ```javascript
   * // Address of the wallet sending the tokens
   * const fromAddress = "{{wallet_address}}";
   *
   * // Address of the wallet you want to send the tokens to
   * const toAddress = "0x...";
   *
   * // The number of tokens you want to send
   * const amount = 100
   *
   * // Note that the connected wallet must have approval to transfer the tokens of the fromAddress
   * await module.transferFrom(fromAddress, toAddress, amount);
   * ```
   */
  public async transferFrom(
    from: string,
    to: string,
    amount: BigNumberish,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("transferFrom", [
        from,
        to,
        amount,
      ]),
    };
  }

  /**
   * Allows the specified `spender` wallet to transfer the given `amount` of tokens to another wallet
   *
   * @example
   * ```javascript
   * // Address of the wallet to allow transfers from
   * const spenderAddress = "0x...";
   *
   * // The number of tokens to give as allowance
   * const amount = 100
   *
   * await module.setAllowance(spenderAddress, amount);
   * ```
   */
  public async setAllowance(
    spender: string,
    amount: BigNumber,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("approve", [
        spender,
        amount,
      ]),
    };
  }

  /**
   * Transfer Tokens To Many Wallets
   *
   * @remarks Mint tokens from the connected wallet to many wallets
   *
   * @example
   * ```javascript
   * // Data of the tokens you want to mint
   * const data = [
   *   {
   *     toAddress: "{{wallet_address}}", // Address to mint tokens to
   *     amount: 100, // How many tokens to mint to specified address
   *   },
   *  {
   *    toAddress: "0x...",
   *    amount: 100,
   *  }
   * ]
   *
   * await module.transferBatch(data);
   * ```
   */
  public async transferBatch(args: TokenMintInput[]) {
    const encoded = args.map((arg) =>
      this.contractWrapper.readContract.interface.encodeFunctionData(
        "transfer",
        [arg.toAddress, arg.amount],
      ),
    );
    await this.contractWrapper.multiCall(encoded);
  }

  /**
   * Burn Tokens
   *
   * @remarks Burn tokens held by the connected wallet
   *
   * @example
   * ```javascript
   * // The amount of this token you want to burn
   * const amount = 100;
   *
   * await module.burn(amount);
   * ```
   */
  public async burn(amount: BigNumberish): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [amount]),
    };
  }

  /**
   * Burn Tokens
   *
   * @remarks Burn tokens held by the specified wallet
   *
   * @example
   * ```javascript
   * // Address of the wallet sending the tokens
   * const holderAddress = "{{wallet_address}}";
   *
   * // The amount of this token you want to burn
   * const amount = 100;
   *
   * await module.burnFrom(holderAddress, amount);
   * ```
   */
  public async burnFrom(
    holder: string,
    amount: BigNumberish,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("burnFrom", [
        holder,
        amount,
      ]),
    };
  }

  /**
   * Set whether Tokens in this Module can be transferred or not.
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

  private async getValue(value: BigNumberish): Promise<CurrencyValue> {
    return await fetchCurrencyValue(
      this.contractWrapper.getProvider(),
      this.getAddress(),
      BigNumber.from(value),
    );
  }
}
