import { BigNumber } from "@ethersproject/bignumber";
import { ProviderOrSigner } from "../core";
export interface Currency {
    name: string;
    symbol: string;
    decimals: number;
}
export interface CurrencyValue extends Currency {
    value: string;
    displayValue: string;
}
export declare function getCurrencyMetadata(providerOrSigner: ProviderOrSigner, asset: string): Promise<Currency>;
export declare function getCurrencyWithPrice(providerOrSigner: ProviderOrSigner, asset: string, price: BigNumber): Promise<CurrencyValue>;
