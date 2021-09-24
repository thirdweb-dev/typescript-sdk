import { ContractMetadata, getContractMetadata } from "../common/contract";
import { Module } from "../core/module";
import { ProtocolControl, ProtocolControl__factory } from "../types";

export enum ModuleType {
  Coin = 0,
  NFTCollection = 1,
  NFT = 2,
  DynamicNFT = 3,
  AccessNFT = 4,
  Pack = 5,
  Market = 6,
  Other = 7,
}

export interface ControlContract {
  address: string;
  metadata?: ContractMetadata;
}

export class ControlSDK extends Module {
  private __contract: ProtocolControl | null = null;
  private get contract(): ProtocolControl {
    return this.__contract || this.connectContract();
  }
  private set contract(value: ProtocolControl) {
    this.__contract = value;
  }

  protected connectContract(): ProtocolControl {
    return (this.contract = ProtocolControl__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  private async getModuleAddress(moduleType: ModuleType): Promise<string[]> {
    return await this.contract.getAllModulesOfType(moduleType);
  }

  public async getAllContractMetadata(
    addresses: string[],
  ): Promise<ControlContract[]> {
    const metadatas = await Promise.all(
      addresses.map((address) =>
        getContractMetadata(
          this.providerOrSigner,
          address,
          this.ipfsGatewayUrl,
        ).catch(() => undefined),
      ),
    );
    return addresses
      .filter((d) => d)
      .map((address, i) => {
        return {
          address,
          metadata: metadatas[i],
        };
      });
  }

  public async getPackAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.Pack);
  }

  public async getPackContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getPackAddress());
  }

  public async getNFTAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.NFT);
  }

  public async getNFTContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getNFTAddress());
  }

  public async getCollectionAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.NFTCollection);
  }

  public async getCollectionContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getCollectionAddress());
  }

  public async getCurrencyAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.Coin);
  }

  public async getCurrencyContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getCurrencyAddress());
  }

  public async getMarketAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.Market);
  }

  public async getMarketContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getMarketAddress());
  }
}
