import { ContractWrapper } from "./contract-wrapper";
import { DropERC20, TokenERC20 } from "@thirdweb-dev/contracts";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { IStorage } from "../interfaces";
import { NetworkOrSignerOrProvider, TransactionResult } from "../types";
import { UpdateableNetwork } from "../interfaces/contract";
import { SDKOptions, SDKOptionsSchema } from "../../schema/sdk-options";
import { Amount, Currency, CurrencyValue } from "../../types/currency";
import {
  fetchCurrencyMetadata,
  fetchCurrencyValue,
} from "../../common/currency";
import { TokenMintInput } from "../../schema/tokens/token";
import { getRoleHash } from "../../common/role";
import { AddressZero } from "@ethersproject/constants";
import { PriceSchema } from "../../schema";

/**
 * Standard ERC20 functions
 * @public
 */
export class Erc20<T extends TokenERC20 | DropERC20>
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
   * Get the token Metadata (name, symbol, etc...)
   *
   * @example
   * ```javascript
   * const token = await contract.get();
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
   * const balance = await contract.balance();
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
   * const balance = await contract.balanceOf(address);
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
  public async totalSupply(): Promise<CurrencyValue> {
    return await this.getValue(
      await this.contractWrapper.readContract.totalSupply(),
    );
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
   * const allowance = await contract.allowanceOf(otherAddress);
   * console.log(allowance);
   * ```
   *
   * @returns The allowance of one wallet over anothers funds.
   */
  public async allowance(spender: string): Promise<CurrencyValue> {
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
   * const allowance = await contract.allowanceOf(address, spenderAddress);
   * console.log(allowance);
   * ```
   *
   * @returns The allowance of one wallet over anothers funds.
   */
  public async allowanceOf(
    owner: string,
    spender: string,
  ): Promise<CurrencyValue> {
    return await this.getValue(
      await this.contractWrapper.readContract.allowance(owner, spender),
    );
  }

  /**
   * Get whether users can transfer tokens from this contract
   */
  public async isTransferRestricted(): Promise<boolean> {
    const anyoneCanTransfer = await this.contractWrapper.readContract.hasRole(
      getRoleHash("transfer"),
      AddressZero,
    );
    return !anyoneCanTransfer;
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
   * const amount = 0.1;
   *
   * await contract.transfer(toAddress, amount);
   * ```
   */
  public async transfer(
    to: string,
    amount: Amount,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("transfer", [
        to,
        await this.normalizeAmount(amount),
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
   * const amount = 1.2
   *
   * // Note that the connected wallet must have approval to transfer the tokens of the fromAddress
   * await contract.transferFrom(fromAddress, toAddress, amount);
   * ```
   */
  public async transferFrom(
    from: string,
    to: string,
    amount: Amount,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("transferFrom", [
        from,
        to,
        await this.normalizeAmount(amount),
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
   * await contract.setAllowance(spenderAddress, amount);
   * ```
   */
  public async setAllowance(
    spender: string,
    amount: Amount,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("approve", [
        spender,
        await this.normalizeAmount(amount),
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
   * await contract.transferBatch(data);
   * ```
   */
  public async transferBatch(args: TokenMintInput[]) {
    const encoded = await Promise.all(
      args.map(async (arg) => {
        const amountWithDecimals = await this.normalizeAmount(arg.amount);
        return this.contractWrapper.readContract.interface.encodeFunctionData(
          "transfer",
          [arg.toAddress, amountWithDecimals],
        );
      }),
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
   * const amount = 1.2;
   *
   * await contract.burn(amount);
   * ```
   */
  public async burn(amount: Amount): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [
        await this.normalizeAmount(amount),
      ]),
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
   * const amount = 1.2;
   *
   * await contract.burnFrom(holderAddress, amount);
   * ```
   */
  public async burnFrom(
    holder: string,
    amount: Amount,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("burnFrom", [
        holder,
        await this.normalizeAmount(amount),
      ]),
    };
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * @internal
   */
  protected async getValue(value: BigNumberish): Promise<CurrencyValue> {
    return await fetchCurrencyValue(
      this.contractWrapper.getProvider(),
      this.getAddress(),
      BigNumber.from(value),
    );
  }

  protected async normalizeAmount(amount: Amount): Promise<BigNumber> {
    const decimals = await this.contractWrapper.readContract.decimals();
    return ethers.utils.parseUnits(PriceSchema.parse(amount), decimals);
  }
}
