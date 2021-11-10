import { Royalty, Royalty__factory } from "@3rdweb/contracts";
import { BigNumber } from "ethers";
import { ModuleType } from "../common";
import { Currency, getCurrencyMetadata } from "../common/currency";
import { Module } from "../core/module";
import { SplitRecipient } from "../types/SplitRecipient";

export interface ISplitsModule {
  /**
   * Returns a list of all recipients with their
   * respective split percentages.
   *
   */
  getAllRecipients(): Promise<SplitRecipient[]>;

  /**
   * Get the split percentage of a recipient.
   *
   * @param address - The address of the recipient.
   */
  getRecipientSplitPercentage(address: string): Promise<SplitRecipient>;

  /**
   * Returns the amount of royalty available for a recipient
   * to withdraw in the native currency.
   *
   * @param address - The address of the recipient to check the balance of.
   */
  balanceOf(address: string): Promise<BigNumber>;

  /**
   * Returns the amount of royalty available for a recipient
   * to withdraw in the native currency in a specific currency.
   *
   * @param walletAddress - The address of the recipient to check the balance of.
   * @param tokenAddress - The address of the currency to check the balance in.
   */
  balanceOfByToken(
    walletAddress: string,
    tokenAddress: string,
  ): Promise<BigNumber>;

  /**
   * Transaction that will withdraw the split amount of royalty that
   * the `address` is owed and transfer it to the wallet.
   *
   * @param address - The address to withdraw royalties for.
   */
  withdraw(address: string): Promise<void>;

  /**
   * Transaction that will withdraw the split amount of royalty that
   * the `address` is owed and transfer it to the wallet, in the
   * currency specified by `tokenAddress`.
   *
   * For example: If the native currency of a chain is ETH but the user
   * wants to withdraw their split in $MATIC, they should pass
   * the address of the $MATIC token as the `tokenAddress` parameter.
   *
   * @param walletAddress - The address to withdraw royalties for.
   */
  withdrawToken(walletAddress: string, tokenAddress: string): Promise<void>;
}

/**
 *
 * Access this module by calling {@link ThirdwebSDK.getSplitsModule}
 * @public
 */
export class SplitsModule extends Module implements ISplitsModule {
  public static moduleType: ModuleType = ModuleType.SPLITS as const;

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
    return SplitsModule.moduleType;
  }

  public async get(): Promise<Currency> {
    return await getCurrencyMetadata(this.providerOrSigner, this.address);
  }
}
