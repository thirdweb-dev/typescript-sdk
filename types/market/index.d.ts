import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { CurrencyValue } from "../common/currency";
import { NFTMetadata } from "../common/nft";
import { Market } from "../types";
export interface ListingFilter {
    seller?: string;
    tokenContract?: string;
    tokenId?: string;
}
export interface Listing {
    id: string;
    seller: string;
    tokenContract: string;
    tokenId: string;
    tokenMetadata?: NFTMetadata;
    quantity: BigNumber;
    currencyContract: string;
    currencyMetadata?: CurrencyValue;
    price: BigNumber;
    saleStart: Date | null;
    saleEnd: Date | null;
}
export declare class MarketSDK extends SubSDK {
    readonly contract: Market;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    private transformResultToListing;
    get(listingId: string): Promise<Listing>;
    getAll(filter?: ListingFilter): Promise<Listing[]>;
    list(assetContract: string, tokenId: string, currencyContract: string, price: BigNumber, quantity: BigNumber, secondsUntilStart?: number, secondsUntilEnd?: number): Promise<Listing>;
    unlistAll(listingId: string): Promise<void>;
    unlist(listingId: string, quantity: BigNumberish): Promise<void>;
    buy(listingId: string, quantity: BigNumberish): Promise<Listing>;
}
