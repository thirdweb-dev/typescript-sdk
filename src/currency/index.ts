import { BigNumber, BigNumberish } from "ethers";
import { ModuleType } from "../common";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
import { uploadMetadata } from "../common/ipfs";
import { Module } from "../core/module";
import { Coin, Coin__factory } from "../types";

/**
 * The CurrencyModule. This should always be created via `getCurrencyModule()` on the main SDK.
 * @public
 */
export class CurrencyModule extends Module {
  public static moduleType: ModuleType = ModuleType.Currency;

  private __contract: Coin | null = null;
  /**
   * @deprecated - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): Coin {
    return this.__contract || this.connectContract();
  }
  private set contract(value: Coin) {
    this.__contract = value;
  }

  protected connectContract(): Coin {
    return (this.contract = Coin__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async get(): Promise<Currency> {
    return await getCurrencyMetadata(this.providerOrSigner, this.address);
  }

  public async getValue(value: BigNumberish): Promise<CurrencyValue> {
    return await getCurrencyValue(
      this.providerOrSigner,
      this.address,
      BigNumber.from(value),
    );
  }

  // passthrough to the contract
  public balanceOf = async (address: string): Promise<CurrencyValue> =>
    this.getValue(await this.contract.balanceOf(address));

  public balance = async (): Promise<CurrencyValue> =>
    this.balanceOf(await this.getSignerAddress());

  public transfer = async (to: string, amount: BigNumber) => {
    const tx = await this.contract.transfer(to, amount);
    await tx.wait();
  };

  public allowance = async (spender: string): Promise<BigNumber> =>
    this.contract.allowance(await this.getSignerAddress(), spender);

  public setAllowance = async (spender: string, amount: BigNumber) => {
    const tx = await this.contract.approve(spender, amount);
    await tx.wait();
  };

  // owner functions
  public mint = async (to: string, amount: BigNumberish) => {
    const tx = await this.contract.mint(to, amount);
    await tx.wait();
  };

  public burn = async (amount: BigNumberish) => {
    const tx = await this.contract.burn(amount);
    await tx.wait();
  };

  public burnFrom = async (to: string, amount: BigNumberish) => {
    const tx = await this.contract.burnFrom(to, amount);
    await tx.wait();
  };

  public transferFrom = async (
    from: string,
    to: string,
    amount: BigNumberish,
  ) => {
    const tx = await this.contract.transferFrom(from, to, amount);
    await tx.wait();
  };

  public setContractURI = async (metadata: string | Record<string, any>) => {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.setContractURI(uri);
    await tx.wait();
  };
}
