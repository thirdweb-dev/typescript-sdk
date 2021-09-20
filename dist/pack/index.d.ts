import type { SDKOptions, ProviderOrSigner } from "../core";
import { NFTMetadata } from "../common/nft";
import { BigNumber } from "@ethersproject/bignumber";
import { SubSDK } from "../core/sub-sdk";
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
export declare class PackSDK extends SubSDK {
    readonly contract: PackContract;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    open(packId: string): Promise<NFTMetadata[]>;
    get(packId: string): Promise<Pack>;
    getAll(): Promise<Pack[]>;
    getNFTs(packId: string): Promise<PackNFT[]>;
    balanceOf: (address: string, tokenId: string) => Promise<BigNumber>;
    balance: (tokenId: string) => Promise<BigNumber>;
    transfer: (to: string, tokenId: string, amount: BigNumber) => Promise<void>;
}
