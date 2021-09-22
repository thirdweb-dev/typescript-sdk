import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
import { Module } from "../core/module";
import { Coin, Coin__factory } from "../types";

export class CoinSDK extends Module {
  private _contract: Coin | null = null;
  public get contract(): Coin {
    return this._contract || this.connectContract();
  }
  private set contract(value: Coin) {
    this._contract = value;
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
}
