import { Royalty, Royalty__factory } from "@3rdweb/contracts";
import { BigNumber, BigNumberish } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import { Currency, getCurrencyMetadata } from "../common/currency";
import { Module } from "../core/module";

export interface IRoyaltyModule {
  /**
   * Get the total shares held by payees
   */
  totalShares(): Promise<BigNumber>;

  /**
   * Get the total amount of royalty already released
   */
  totalReleased(): Promise<BigNumber>;

  /**
   * Returns the amount of `token` released to payees
   *
   * @param tokenAddress - The ERC20 token address to check royalty distributions for
   */
  totalReleasedByToken(tokenAddress: string): Promise<BigNumber>;

  /**
   * Gets the amount of shares held by an account at the address `address`
   *
   * @param address - The address to check the shares held for
   */
  shares(address: string): Promise<BigNumber>;

  /**
   * Gets the amount of royalties already released to the address `address`
   *
   * @param address - The address to check the amount of released royalties
   */
  released(address: string): Promise<BigNumber>;

  /**
   * Gets the amount of royalties already released to the address `address`
   * for the specific token `tokenAddress`
   *
   * @param address - The address to check the amount of released royalties
   * @param tokenAddress - The ERC20 token address to check royalty distributions for
   */
  releasedByToken(address: string, tokenAddress: string): Promise<BigNumber>;

  /**
   * Gets the address of the payee at index `index`
   *
   * @param index - The index of the payee to get the address of
   */
  payee(index: BigNumberish): Promise<string>;

  /**
   * Triggers the release of the amount of tokens owed to `address` according
   * to their percentage of the total shares and their previous withdrawals.
   *
   * @param address - The address of the payee to release the tokens for
   */
  release(address: string): Promise<void>;

  /**
   * Triggers the release of the amount of `tokenAddress` tokens owed to `address`
   * according to their percentage of the total shares and their previous withdrawals.
   *
   * @param address - The address of the payee to release the tokens for
   * @param tokenAddress - The ERC20 token address to release the tokens for
   */
  releaseByToken(address: string, tokenAddress: string): Promise<void>;
}

/**
 *
 * Access this module by calling {@link ThirdwebSDK.getRoyaltyModule}
 * @public
 */
export class RoyaltyModule extends Module implements IRoyaltyModule {
  public static moduleType: ModuleType = ModuleType.ROYALTY as const;

  /**
   * @internal
   */
  protected connectContract(): Royalty {
    return Royalty__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return RoyaltyModule.moduleType;
  }

  public async get(): Promise<Currency> {
    return await getCurrencyMetadata(this.providerOrSigner, this.address);
  }

  public totalShares(): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  public totalReleased(): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  public totalReleasedByToken(tokenAddress: string): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  public shares(address: string): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  public released(address: string): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  public releasedByToken(
    address: string,
    tokenAddress: string,
  ): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  public payee(index: BigNumber): Promise<string> {
    throw new Error("Method not implemented.");
  }

  public release(address: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public releaseByToken(address: string, tokenAddress: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
