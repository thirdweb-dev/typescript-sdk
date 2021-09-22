import { ContractMetadata } from "../common/contract";
import { Module } from "../core/module";
import { Registry } from "../types";
export interface RegistryControl {
    address: string;
    version: number;
    metadata?: ContractMetadata;
}
export declare class RegistrySDK extends Module {
    private _contract;
    get contract(): Registry;
    private set contract(value);
    protected connectContract(): Registry;
    getProtocolContracts(): Promise<RegistryControl[]>;
}
