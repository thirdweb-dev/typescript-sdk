import { TokenErc20ContractSchema } from "../schema/contracts/token-erc20";
import { TokenERC20, TokenERC20__factory } from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { Erc20 } from "../core/classes/erc-20";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { TokenMintInput } from "../schema/tokens/token";
import { ContractEncoder } from "../core/classes/contract-encoder";

/**
 * Create a standard crypto token or crypto currency.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getTokenContract("{{contract_address}}");
 * ```
 *
 * @public
 */
export class TokenErc20Contract extends Erc20<TokenERC20> {
  static contractType = "TokenERC20" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = TokenERC20__factory;
  /**
   * @internal
   */
  static schema = TokenErc20ContractSchema;

  public metadata: ContractMetadata<
    TokenERC20,
    typeof TokenErc20Contract.schema
  >;
  public roles: ContractRoles<
    TokenERC20,
    typeof TokenErc20Contract.contractRoles[number]
  >;
  encoder: ContractEncoder<TokenERC20>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC20>(
      network,
      address,
      TokenErc20Contract.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      TokenErc20Contract.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      TokenErc20Contract.contractRoles,
    );
    this.encoder = new ContractEncoder(this.contractWrapper);
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
   * Mint Tokens for the connected wallet
   *
   * @see mintTo
   */
  public async mint(amount: BigNumberish): Promise<TransactionResult> {
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
   * const amount = "1.5";
   *
   * await contract.mintTo(toAddress, amount);
   * ```
   */
  public async mintTo(
    to: string,
    amount: BigNumberish,
  ): Promise<TransactionResult> {
    const amountWithDecimals = ethers.utils.parseUnits(
      BigNumber.from(amount).toString(),
      await this.contractWrapper.readContract.decimals(),
    );
    return {
      receipt: await this.contractWrapper.sendTransaction("mint", [
        to,
        amountWithDecimals,
      ]),
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
   * await contract.mintBatchTo(data);
   * ```
   */
  public async mintBatchTo(args: TokenMintInput[]): Promise<TransactionResult> {
    const encoded = [];
    for (const arg of args) {
      const amountWithDecimals = ethers.utils.parseUnits(
        BigNumber.from(arg.amount).toString(),
        await this.contractWrapper.readContract.decimals(),
      );
      encoded.push(
        this.contractWrapper.readContract.interface.encodeFunctionData("mint", [
          arg.toAddress,
          amountWithDecimals,
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
  public async delegateTo(
    delegateeAddress: string,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("delegate", [
        delegateeAddress,
      ]),
    };
  }
}
