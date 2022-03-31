import { DropERC20, DropERC20__factory } from "@thirdweb-dev/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import {
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
export class TokenDrop extends Erc20<DropERC20> {
  static contractType = "token-drop" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
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
  public claimConditions: DropClaimConditions<DropERC20>;

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
