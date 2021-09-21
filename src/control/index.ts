import { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { ProtocolControl, ProtocolControl__factory } from "../types";
import { ContractMetadata, getContractMetadata } from "../common/contract";

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

export class ControlSDK extends SubSDK {
  public readonly contract: ProtocolControl;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    super(providerOrSigner, address, opts);

    this.contract = ProtocolControl__factory.connect(
      this.address,
      this.providerOrSigner,
    );
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
          this.opts.ipfsGatewayUrl,
        ).catch(() => null),
      ),
    );
    return addresses.map((address, i) => {
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

  public async getCoinAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.Coin);
  }

  public async getCoinContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getCoinAddress());
  }

  public async getMarketAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.Market);
  }

  public async getMarketContracts(): Promise<ControlContract[]> {
    return await this.getAllContractMetadata(await this.getMarketAddress());
  }
}
