import type { ProviderOrSigner } from "../core";
import { BigNumber } from "@ethersproject/bignumber";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { NFTCollection } from "../types";
import { NFTMetadata } from "../common/nft";
export declare class NFTSDK extends SubSDK {
    readonly contract: NFTCollection;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    get(tokenId: string): Promise<NFTMetadata>;
    getAll(): Promise<NFTMetadata[]>;
    balanceOf: (address: string, tokenId: string) => Promise<BigNumber>;
    balance: (tokenId: string) => Promise<BigNumber>;
    transfer: (to: string, tokenId: string, amount: BigNumber) => Promise<void>;
}
