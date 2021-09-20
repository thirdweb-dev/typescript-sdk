import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import type { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Coin, Coin__factory } from "../types";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";

export class CoinSDK extends SubSDK {
  public contract: Coin;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    super(providerOrSigner, address, opts);

    this.contract = Coin__factory.connect(this.address, this.providerOrSigner);
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
