import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { CurrencyValue } from "../common/currency";
import { NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
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
export declare class MarketSDK extends Module {
    private _contract;
    get contract(): Market;
    private set contract(value);
    protected connectContract(): Market;
    private transformResultToListing;
    get(listingId: string): Promise<Listing>;
    getAll(filter?: ListingFilter): Promise<Listing[]>;
    list(assetContract: string, tokenId: string, currencyContract: string, price: BigNumber, quantity: BigNumber, secondsUntilStart?: number, secondsUntilEnd?: number): Promise<Listing>;
    unlistAll(listingId: string): Promise<void>;
    unlist(listingId: string, quantity: BigNumberish): Promise<void>;
    buy(listingId: string, quantity: BigNumberish): Promise<Listing>;
}
