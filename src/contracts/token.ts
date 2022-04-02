import { TokenErc20ContractSchema } from "../schema/contracts/token-erc20";
import { TokenERC20, TokenERC20__factory } from "@thirdweb-dev/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import {
  ContractInterceptor,
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { Erc20 } from "../core/classes/erc-20";
import { TokenMintInput } from "../schema/tokens/token";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { GasCostEstimator } from "../core/classes";
import { Amount, CurrencyValue } from "../types";
import { TokenERC20History } from "../core/classes/erc-20-history";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";
import { Erc20SignatureMinting } from "../core/classes/erc-20-signature-minting";

/**
 * Create a standard crypto token or cryptocurrency.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getToken("{{contract_address}}");
 * ```
 *
 * @public
 */
export class Token extends Erc20<TokenERC20> {
  static contractType = "token" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = TokenERC20__factory;
  /**
   * @internal
   */
  static schema = TokenErc20ContractSchema;

  public metadata: ContractMetadata<TokenERC20, typeof Token.schema>;
  public roles: ContractRoles<TokenERC20, typeof Token.contractRoles[number]>;
  public encoder: ContractEncoder<TokenERC20>;
  public estimator: GasCostEstimator<TokenERC20>;
  public history: TokenERC20History;
  public events: ContractEvents<TokenERC20>;
  public platformFee: ContractPlatformFee<TokenERC20>;
  /**
   * Signature Minting
   * @remarks Generate tokens that can be minted only with your own signature, attaching your own set of mint conditions.
   * @example
   * ```javascript
   * // see how to craft a payload to sign in the `contract.signature.generate()` documentation
   * const signedPayload = contract.signature.generate(payload);
   *
   * // now anyone can mint the NFT
   * const tx = contract.signature.mint(signedPayload);
   * const receipt = tx.receipt; // the mint transaction receipt
   * const mintedId = tx.id; // the id of the NFT minted
   * ```
   */
  public signature: Erc20SignatureMinting;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<TokenERC20>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC20>(
      network,
      address,
      Token.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      Token.schema,
      this.storage,
    );
    this.roles = new ContractRoles(this.contractWrapper, Token.contractRoles);
    this.history = new TokenERC20History(this.contractWrapper);
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.platformFee = new ContractPlatformFee(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
    this.signature = new Erc20SignatureMinting(
      this.contractWrapper,
      this.roles,
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
  public async getVoteBalance(): Promise<CurrencyValue> {
    return await this.getVoteBalanceOf(
      await this.contractWrapper.getSignerAddress(),
    );
  }

  public async getVoteBalanceOf(account: string): Promise<CurrencyValue> {
    return await this.getValue(
      await this.contractWrapper.readContract.getVotes(account),
    );
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
   * @remarks See {@link Token.mintTo}
   */
  public async mint(amount: Amount): Promise<TransactionResult> {
    return this.mintTo(await this.contractWrapper.getSignerAddress(), amount);
  }

  /**
   * Mint Tokens
   *
   * @remarks Mint tokens to a specified address.
   *
   * @example
   * ```javascript
   * const toAddress = "{{wallet_address}}"; // Address of the wallet you want to mint the tokens to
   * const amount = "1.5"; // The amount of this token you want to mint
   *
   * await contract.mintTo(toAddress, amount);
   * ```
   */
  public async mintTo(to: string, amount: Amount): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("mintTo", [
        to,
        await this.normalizeAmount(amount),
      ]),
    };
  }

  /**
   * Mint Tokens To Many Wallets
   *
   * @remarks Mint tokens to many wallets in one transaction.
   *
   * @example
   * ```javascript
   * // Data of the tokens you want to mint
   * const data = [
   *   {
   *     toAddress: "{{wallet_address}}", // Address to mint tokens to
   *     amount: 0.2, // How many tokens to mint to specified address
   *   },
   *  {
   *    toAddress: "0x...",
   *    amount: 1.4,
   *  }
   * ]
   *
   * await contract.mintBatchTo(data);
   * ```
   */
  public async mintBatchTo(args: TokenMintInput[]): Promise<TransactionResult> {
    const encoded = [];
    for (const arg of args) {
      encoded.push(
        this.contractWrapper.readContract.interface.encodeFunctionData(
          "mintTo",
          [arg.toAddress, await this.normalizeAmount(arg.amount)],
        ),
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
