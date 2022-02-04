import { TokenErc20ModuleSchema } from "../schema/modules/token-erc20";
import { TokenERC20, TokenERC20__factory } from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResultPromise,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { Erc20 } from "../core/classes/erc-20";
import { BigNumber, BigNumberish } from "ethers";
import { TokenMintInput } from "../schema/tokens/token";

export class TokenErc20Module extends Erc20<TokenERC20> {
  static moduleType = "TokenERC20";
  static schema = TokenErc20ModuleSchema;
  static moduleRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = TokenERC20__factory;

  public metadata: ContractMetadata<TokenERC20, typeof TokenErc20Module.schema>;
  public roles: ContractRoles<
    TokenERC20,
    typeof TokenErc20Module.moduleRoles[number]
  >;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC20>(
      network,
      address,
      TokenErc20Module.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      TokenErc20Module.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      TokenErc20Module.moduleRoles,
    );
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * Get your wallet voting power for the current checkpoints
   *
   * @returns the amount of voting power in tokens
   */
  public async getVoteBalance(): Promise<BigNumber> {
    return await this.getVoteBalanceOf(
      await this.contractWrapper.getSignerAddress(),
    );
  }

  public async getVoteBalanceOf(account: string): Promise<BigNumber> {
    return await this.contractWrapper.readContract.getVotes(account);
  }

  /**
   * Get your voting delegatee address
   *
   * @returns the address of your vote delegatee
   */
  public async getDelegation(): Promise<string> {
    return await this.getDelegationOf(
      await this.contractWrapper.getSignerAddress(),
    );
  }

  /**
   * Get a specific address voting delegatee address
   *
   * @returns the address of your vote delegatee
   */
  public async getDelegationOf(account: string): Promise<string> {
    return await this.contractWrapper.readContract.delegates(account);
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Mint Tokens
   *
   * @remarks Mint tokens to the connected wallet
   *
   * @example
   * ```javascript
   * // The amount of this token you want to mint
   * const amount = ethers.utils.parseEther("1.5");
   *
   * await module.mintTo(toAddress, amount);
   * ```
   */
  public async mint(amount: BigNumberish): TransactionResultPromise {
    return this.mintTo(await this.contractWrapper.getSignerAddress(), amount);
  }

  /**
   * Mint Tokens
   *
   * @remarks Mint tokens to a specified address
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the tokens to
   * const toAddress = "{{wallet_address}}";
   *
   * // The amount of this token you want to mint
   * const amount = ethers.utils.parseEther("1.5");
   *
   * await module.mintTo(toAddress, amount);
   * ```
   */
  public async mintTo(
    to: string,
    amount: BigNumberish,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("mint", [to, amount]),
    };
  }

  /**
   * Mint Tokens To Many Wallets
   *
   * @remarks Mint tokens to many wallets
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
   * await module.mintBatchTo(data);
   * ```
   */
  public async mintBatchTo(args: TokenMintInput[]): TransactionResultPromise {
    const encoded = [];
    for (const arg of args) {
      encoded.push(
        this.contractWrapper.readContract.interface.encodeFunctionData("mint", [
          arg.toAddress,
          arg.amount,
        ]),
      );
    }
    return { receipt: await this.contractWrapper.multiCall(encoded) };
  }

  /**
   * Lets you delegate your voting power to the delegateeAddress
   *
   * @param delegateeAddress - delegatee wallet address
   * @alpha
   */
  public async delegateTo(delegateeAddress: string): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("delegate", [
        delegateeAddress,
      ]),
    };
  }
}
