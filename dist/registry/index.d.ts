import { SDKOptions, ProviderOrSigner } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Registry } from "../types";
import { ContractMetadata } from "../common/contract";
export interface RegistryControl {
    address: string;
    version: number;
    metadata?: ContractMetadata;
}
export declare class RegistrySDK extends SubSDK {
    readonly contract: Registry;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    getProtocolContracts(): Promise<RegistryControl[]>;
}
