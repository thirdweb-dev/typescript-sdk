import { Royalty, Royalty__factory } from "@3rdweb/contracts";
import { BigNumberish } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import { Currency, getCurrencyMetadata } from "../common/currency";
import { Module } from "../core/module";

export interface IRoyalty {
  /**
   * Get the total shares held by payees
   */
  totalShares(): Promise<BigNumberish>;

  /**
   * Get the total amount of royalty already released
   */
  totalReleased(): Promise<BigNumberish>;

  /**
   * Returns the amount of `token` released to payees
   *
   * @param tokenAddress - The ERC20 token address to check royalty distributions for
   */
  totalReleasedByToken(tokenAddress: string): Promise<BigNumberish>;

  /**
   * Gets the amount of shares held by an account at the address `address`
   *
   * @param address - The address to check the shares held for
   */
  shares(address: string): Promise<BigNumberish>;

  /**
   * Gets the amount of royalties already released to the address `address`
   *
   * @param address - The address to check the amount of released royalties
   */
  released(address: string): Promise<BigNumberish>;

  /**
   * Gets the amount of royalties already released to the address `address`
   * for the specific token `tokenAddress`
   *
   * @param address - The address to check the amount of released royalties
   * @param tokenAddress - The ERC20 token address to check royalty distributions for
   */
  releasedByToken(address: string, tokenAddress: string): Promise<BigNumberish>;

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
export class RoyaltyModule extends Module implements IRoyalty {
  public static moduleType: ModuleType = ModuleType.ROYALTY as const;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.pauser,
    RolesMap.transfer,
  ] as const;

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return RoyaltyModule.roles;
  }

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

  public totalShares(): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }

  public totalReleased(): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }

  public totalReleasedByToken(tokenAddress: string): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }

  public shares(address: string): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }

  public released(address: string): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }

  public releasedByToken(
    address: string,
    tokenAddress: string,
  ): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }

  public payee(index: BigNumberish): Promise<string> {
    throw new Error("Method not implemented.");
  }

  public release(address: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public releaseByToken(address: string, tokenAddress: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
