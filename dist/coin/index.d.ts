import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import type { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Coin } from "../types";
import { Currency, CurrencyValue } from "../common/currency";
export declare class CoinSDK extends SubSDK {
    contract: Coin;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    get(): Promise<Currency>;
    getValue(value: BigNumberish): Promise<CurrencyValue>;
    balanceOf: (address: string) => Promise<CurrencyValue>;
    balance: () => Promise<CurrencyValue>;
    transfer: (to: string, amount: BigNumber) => Promise<void>;
}
