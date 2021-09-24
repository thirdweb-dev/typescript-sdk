import { BigNumber, BigNumberish } from "ethers";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
import { Module } from "../core/module";
import { Coin, Coin__factory } from "../types";

export class CurrencySDK extends Module {
  private __contract: Coin | null = null;
  private get contract(): Coin {
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
}
