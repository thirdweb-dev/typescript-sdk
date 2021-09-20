import { Signer } from "@ethersproject/abstract-signer";
import { Network, Provider } from "@ethersproject/providers";
import { SubSDK } from "./sub-sdk";
import { ControlSDK } from "../control";
import { PackSDK } from "../pack";
import { NFTSDK } from "../nft";
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
    getCoinSDK(address: string): SubSDK;
    getMarketSDK(address: string): SubSDK;
    getSignerAddress(): Promise<string>;
    setSigner(providerOrSigner?: ValidProviderInput): ProviderOrSigner;
}
