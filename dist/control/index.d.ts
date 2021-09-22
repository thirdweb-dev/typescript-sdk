import { ContractMetadata } from "../common/contract";
import { Module } from "../core/module";
import { ProtocolControl } from "../types";
export declare enum ModuleType {
    Coin = 0,
    NFTCollection = 1,
    NFT = 2,
    DynamicNFT = 3,
    AccessNFT = 4,
    Pack = 5,
    Market = 6,
    Other = 7
}
export interface ControlContract {
    address: string;
    metadata?: ContractMetadata;
}
export declare class ControlSDK extends Module {
    private _contract;
    get contract(): ProtocolControl;
    private set contract(value);
    protected connectContract(): ProtocolControl;
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
