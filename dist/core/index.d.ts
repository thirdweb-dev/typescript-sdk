import { Signer } from "@ethersproject/abstract-signer";
import { Network, Provider } from "@ethersproject/providers";
import { CoinSDK } from "../coin";
import { ControlSDK } from "../control";
import { MarketSDK } from "../market";
import { NFTSDK } from "../nft";
import { PackSDK } from "../pack";
import { RegistrySDK } from "../registry";
export declare type ProviderOrSigner = Provider | Signer;
export declare type ValidProviderInput = ProviderOrSigner | Network | string;
export interface SDKOptions {
    ipfsGatewayUrl: string;
}
export declare class NFTLabsSDK {
    private ipfsGatewayUrl;
    private modules;
    private providerOrSigner;
    private signer;
    constructor(providerOrNetwork: ValidProviderInput, opts?: Partial<SDKOptions>);
    setProviderOrSigner(providerOrNetwork: ValidProviderInput): ProviderOrSigner;
    private updateModuleSigners;
    private getOrCreateModule;
    isReadOnly(): boolean;
    getControlSDK(address: string): ControlSDK;
    getNFTSDK(address: string): NFTSDK;
    getPackSDK(address: string): PackSDK;
    getCoinSDK(address: string): CoinSDK;
    getMarketSDK(address: string): MarketSDK;
    getRegistrySDK(address: string): RegistrySDK;
}
