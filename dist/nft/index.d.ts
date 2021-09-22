import { BigNumber } from "@ethersproject/bignumber";
import { NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { NFTCollection } from "../types";
export declare class NFTSDK extends Module {
    private _contract;
    get contract(): NFTCollection;
    private set contract(value);
    protected connectContract(): NFTCollection;
    get(tokenId: string): Promise<NFTMetadata>;
    getAll(): Promise<NFTMetadata[]>;
    balanceOf: (address: string, tokenId: string) => Promise<BigNumber>;
    balance: (tokenId: string) => Promise<BigNumber>;
    transfer: (to: string, tokenId: string, amount: BigNumber) => Promise<void>;
}
