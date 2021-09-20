import type { SDKOptions, ProviderOrSigner } from "../core";
import { NFTMetadata } from "../common/nft";
import { BigNumber } from "@ethersproject/bignumber";
import { SubSDK } from "../core/sub-sdk";
import { Pack } from "../types";
export interface PackEntity extends NFTMetadata {
    creator: string;
    currentSupply: BigNumber;
    openStart?: Date;
    openEnd?: Date;
}
export interface RewardEntity extends NFTMetadata {
    supply: BigNumber;
}
export declare class PackSDK extends SubSDK {
    readonly contract: Pack;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    open(packId: string): Promise<NFTMetadata[]>;
    get(packId: string): Promise<PackEntity>;
    getAll(): Promise<NFTMetadata[]>;
    getRewards(packId: string): Promise<RewardEntity[]>;
    balanceOf: (address: string, tokenId: string) => Promise<BigNumber>;
    balance: (tokenId: string) => Promise<BigNumber>;
    transfer: (to: string, tokenId: string, amount: BigNumber) => Promise<void>;
}
