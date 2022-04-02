import { DropERC20, DropERC20__factory } from "@thirdweb-dev/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import {
  ContractInterceptor,
  ContractPlatformFee,
  ContractPrimarySale,
  DropClaimConditions,
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { Erc20 } from "../core/classes/erc-20";
import { BigNumberish, BytesLike } from "ethers";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { GasCostEstimator } from "../core/classes";
import { Amount, ClaimVerification, CurrencyValue } from "../types";
import { DropErc20ContractSchema } from "../schema/contracts/drop-erc20";
import { hexZeroPad } from "@ethersproject/bytes";
import { prepareClaim } from "../common/claim-conditions";

/**
 * Create a Drop contract for a standard crypto token or cryptocurrency.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getTokenDrop("{{contract_address}}");
 * ```
 *
 * @internal
 */
export class TokenDrop extends Erc20<DropERC20> {
  static contractType = "token-drop" as const;
  static contractRoles = ["admin", "transfer"] as const;
  static contractFactory = DropERC20__factory;
  /**
   * @internal
   */
  static schema = DropErc20ContractSchema;

  public metadata: ContractMetadata<DropERC20, typeof TokenDrop.schema>;
  public roles: ContractRoles<
    DropERC20,
    typeof TokenDrop.contractRoles[number]
  >;
  public encoder: ContractEncoder<DropERC20>;
  public estimator: GasCostEstimator<DropERC20>;
  public sales: ContractPrimarySale<DropERC20>;
  public platformFee: ContractPlatformFee<DropERC20>;
  /**
   * Configure claim conditions
   * @remarks Define who can claim Tokens, when and how many.
   * @example
   * ```javascript
   * const presaleStartTime = new Date();
   * const publicSaleStartTime = new Date(Date.now() + 60 * 60 * 24 * 1000);
   * const claimConditions = [
   *   {
   *     startTime: presaleStartTime, // start the presale now
   *     maxQuantity: 3117.42, // limit how many tokens are released in this presale
   *     price: 0.001, // presale price per token
   *     snapshot: ['0x...', '0x...'], // limit claiming to only certain addresses
   *   },
   *   {
   *     startTime: publicSaleStartTime, // 24h after presale, start public sale
   *     price: 0.008, // public sale price per token
   *   }
   * ]);
   * await contract.claimConditions.set(claimConditions);
   * ```
   */
  public claimConditions: DropClaimConditions<DropERC20>;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<DropERC20>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<DropERC20>(
      network,
      address,
      TokenDrop.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      TokenDrop.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      TokenDrop.contractRoles,
    );
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.sales = new ContractPrimarySale(this.contractWrapper);
    this.platformFee = new ContractPlatformFee(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
    this.claimConditions = new DropClaimConditions<DropERC20>(
      this.contractWrapper,
      this.metadata,
      this.storage,
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
   * Claim a certain amount of tokens
   * @remarks See {@link TokenDrop.claimTo}
   * @param amount - the amount of tokens to mint
   * @param proofs - Optional claim proofs
   */
  public async claim(
    amount: Amount,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionResult> {
    return this.claimTo(
      await this.contractWrapper.getSignerAddress(),
      amount,
      proofs,
    );
  }

  /**
   * Claim a certain amount of tokens to a specific Wallet
   *
   * @remarks Let the specified wallet claim Tokens.
   *
   * @example
   * ```javascript
   * const address = "{{wallet_address}}"; // address of the wallet you want to claim the NFTs
   * const quantity = 42.69; // how many tokens you want to claim
   *
   * const tx = await contract.claimTo(address, quantity);
   * const receipt = tx.receipt; // the transaction receipt
   * ```
   *
   * @param destinationAddress - Address you want to send the token to
   * @param amount - Quantity of the tokens you want to claim
   * @param proofs - Optional Array of proofs
   *
   * @returns - The transaction receipt
   */
  public async claimTo(
    destinationAddress: string,
    amount: Amount,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionResult> {
    const quantity = await this.normalizeAmount(amount);
    const claimVerification = await this.prepareClaim(quantity, proofs);
    const receipt = await this.contractWrapper.sendTransaction(
      "claim",
      [
        destinationAddress,
        quantity,
        claimVerification.currencyAddress,
        claimVerification.price,
        claimVerification.proofs,
        claimVerification.maxQuantityPerTransaction,
      ],
      claimVerification.overrides,
    );
    return { receipt };
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

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * Returns proofs and the overrides required for the transaction.
   *
   * @returns - `overrides` and `proofs` as an object.
   */
  private async prepareClaim(
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<ClaimVerification> {
    return prepareClaim(
      quantity,
      await this.claimConditions.getActive(),
      (await this.metadata.get()).merkle,
      this.contractWrapper,
      this.storage,
      proofs,
    );
  }
}
