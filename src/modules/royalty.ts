import { ERC20__factory, Royalty, Royalty__factory } from "@3rdweb/contracts";
import { BigNumber } from "ethers";
import { ModuleType } from "../common";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
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
  balanceOfToken(
    walletAddress: string,
    tokenAddress: string,
  ): Promise<CurrencyValue>;

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

  /**
   * Distributes all funds to the recipients.
   */
  distribute(): Promise<void>;

  /**
   * Distributes all funds to the recipients in the specified currency.
   *
   * @param tokenAddress - The address of the currency to distribute the funds in.
   */
  distributeToken(tokenAddress: string): Promise<void>;
}

/**
 *
 * Access this module by calling {@link ThirdwebSDK.getSplitsModule}
 * @alpha
 */
export class SplitsModule extends Module<Royalty> implements ISplitsModule {
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

  public async getAllRecipients(): Promise<SplitRecipient[]> {
    const recipients: SplitRecipient[] = [];

    let index = BigNumber.from(0);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const recipientAddress = await this.readOnlyContract.payee(index);
        recipients.push(
          await this.getRecipientSplitPercentage(recipientAddress),
        );
        index = index.add(1);
      } catch (err: any) {
        // The only way we know how to detect that we've found all recipients
        // is if we get an error when trying to get the next recipient.
        if (
          "method" in err &&
          (err["method"] as string).toLowerCase().includes("payee(uint256)")
        ) {
          break;
        } else {
          throw err;
        }
      }
    }

    return recipients;
  }

  public async getRecipientSplitPercentage(
    address: string,
  ): Promise<SplitRecipient> {
    const [totalShares, walletsShares] = await Promise.all([
      this.readOnlyContract.totalShares(),
      this.readOnlyContract.shares(address),
    ]);

    // We convert to basis points to avoid floating point loss of precision
    return {
      address,
      splitPercentage:
        walletsShares.mul(BigNumber.from(1e7)).div(totalShares).toNumber() /
        1e5,
    };
  }

  public async balanceOf(address: string): Promise<BigNumber> {
    const walletBalance = await this.readOnlyContract.provider.getBalance(
      this.address,
    );
    const totalReleased = await this.readOnlyContract["totalReleased()"]();
    const totalReceived = walletBalance.add(totalReleased);

    return this._pendingPayment(
      address,
      totalReceived,
      await this.readOnlyContract["released(address)"](address),
    );
  }

  public async balanceOfToken(
    walletAddress: string,
    tokenAddress: string,
  ): Promise<CurrencyValue> {
    const erc20 = ERC20__factory.connect(tokenAddress, this.providerOrSigner);
    const walletBalance = await erc20.balanceOf(this.address);
    const totalReleased = await this.readOnlyContract["totalReleased(address)"](
      tokenAddress,
    );
    const totalReceived = walletBalance.add(totalReleased);
    const value = await this._pendingPayment(
      walletAddress,
      totalReceived,
      await this.readOnlyContract["released(address,address)"](
        tokenAddress,
        walletAddress,
      ),
    );
    return await getCurrencyValue(this.providerOrSigner, tokenAddress, value);
  }

  public async withdraw(address: string): Promise<void> {
    await this.sendTransaction("release(address)", [address]);
  }

  private async _pendingPayment(
    address: string,
    totalReceived: BigNumber,
    alreadyReleased: BigNumber,
  ): Promise<BigNumber> {
    const addressReceived = totalReceived.mul(
      await this.readOnlyContract.shares(address),
    );
    const totalRoyaltyAvailable = addressReceived.div(
      await this.readOnlyContract.totalShares(),
    );
    return totalRoyaltyAvailable.sub(alreadyReleased);
  }

  public async withdrawToken(
    walletAddress: string,
    tokenAddress: string,
  ): Promise<void> {
    await this.sendTransaction("release(address,address)", [
      tokenAddress,
      walletAddress,
    ]);
  }

  public async distribute(): Promise<void> {
    await this.sendTransaction("distribute()", []);
  }

  public async distributeToken(tokenAddress: string): Promise<void> {
    await this.sendTransaction("distribute(address)", [tokenAddress]);
  }
}
