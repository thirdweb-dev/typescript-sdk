import { Signer } from "@ethersproject/abstract-signer";
import { Network, Provider } from "@ethersproject/providers";
import { ControlSDK } from "../control";
import { PackSDK } from "../pack";
import { MarketSDK } from "../market";
import { CoinSDK } from "../coin";
import { NFTSDK } from "../nft";
import { RegistrySDK } from "../registry";
export declare type ProviderOrSigner = Provider | Signer;
export declare type ValidProviderInput = ProviderOrSigner | Network | string;
export interface SDKOptions {
    ipfsGatewayUrl: string;
}
export declare class CoreSDK {
    private providerOrSigner;
    private opts;
    private modules;
    constructor(providerOrNetwork: ValidProviderInput, opts?: Partial<SDKOptions>);
    private getOrCreateSDK;
    getControlSDK(address: string): ControlSDK;
    getPackSDK(address: string): PackSDK;
    getNFTSDK(address: string): NFTSDK;
    getCoinSDK(address: string): CoinSDK;
    getMarketSDK(address: string): MarketSDK;
    getRegistrySDK(address: string): RegistrySDK;
    getSignerAddress(): Promise<string>;
    setSigner(providerOrSigner?: ValidProviderInput): ProviderOrSigner;
}
