import { BigNumber } from "@ethersproject/bignumber";
import { NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { Pack as PackContract } from "../types";
export interface Pack extends NFTMetadata {
    creator: string;
    currentSupply: BigNumber;
    openStart?: Date;
    openEnd?: Date;
}
export interface PackNFT extends NFTMetadata {
    supply: BigNumber;
}
export declare class PackSDK extends Module {
    private _contract;
    get contract(): PackContract;
    private set contract(value);
    protected connectContract(): PackContract;
    open(packId: string): Promise<NFTMetadata[]>;
    get(packId: string): Promise<Pack>;
    getAll(): Promise<Pack[]>;
    getNFTs(packId: string): Promise<PackNFT[]>;
    balanceOf: (address: string, tokenId: string) => Promise<BigNumber>;
    balance: (tokenId: string) => Promise<BigNumber>;
    transfer: (to: string, tokenId: string, amount: BigNumber) => Promise<void>;
}
