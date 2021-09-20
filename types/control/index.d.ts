import { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { ProtocolControl } from "../types";
import { ContractMetadata } from "../common/contract";
export interface ControlContract {
    address: string;
    metadata?: ContractMetadata;
}
export declare class ControlSDK extends SubSDK {
    readonly contract: ProtocolControl;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    private getModuleAddress;
    getAllContractMetadata(addresses: string[]): Promise<ControlContract[]>;
    getPackAddress(): Promise<string[]>;
    getPackContracts(): Promise<ControlContract[]>;
    getNFTAddress(): Promise<string[]>;
    getNFTContracts(): Promise<ControlContract[]>;
    getCoinAddress(): Promise<string[]>;
    getCoinContracts(): Promise<ControlContract[]>;
    getMarketAddress(): Promise<string[]>;
    getMarketContracts(): Promise<ControlContract[]>;
}
