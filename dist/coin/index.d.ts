import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { Currency, CurrencyValue } from "../common/currency";
import { Module } from "../core/module";
import { Coin } from "../types";
export declare class CoinSDK extends Module {
    private _contract;
    get contract(): Coin;
    private set contract(value);
    protected connectContract(): Coin;
    get(): Promise<Currency>;
    getValue(value: BigNumberish): Promise<CurrencyValue>;
    balanceOf: (address: string) => Promise<CurrencyValue>;
    balance: () => Promise<CurrencyValue>;
    transfer: (to: string, amount: BigNumber) => Promise<void>;
}
