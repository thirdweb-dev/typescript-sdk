import type { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Coin } from "../types";
export declare class CoinSDK extends SubSDK {
    contract: Coin;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
}
