import {
  Coin__factory,
  DataStore__factory,
  LazyNFT__factory,
  Market__factory,
  NFTCollection__factory,
  NFT__factory,
  Pack__factory,
  ProtocolControl,
  ProtocolControl__factory,
  Royalty__factory,
} from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, ethers, Signer } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { JsonConvert } from "json2typescript";
import { ChainlinkVrf, Role, RolesMap, uploadMetadata } from "../common";
import { getContractMetadata } from "../common/contract";
import { invariant } from "../common/invariant";
import { ModuleType } from "../common/module-type";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";
import IAppModule from "../interfaces/IAppModule";
import BundleModuleMetadata from "../types/module-deployments/BundleModuleMetadata";
import CurrencyModuleMetadata from "../types/module-deployments/CurrencyModuleMetadata";
import DatastoreModuleMetadata from "../types/module-deployments/DatastoreModuleMetadata";
import DropModuleMetadata from "../types/module-deployments/DropModuleMetadata";
import MarketModuleMetadata from "../types/module-deployments/MarketModuleMetadata";
import NftModuleMetadata from "../types/module-deployments/NftModuleMetadata";
import PackModuleMetadata from "../types/module-deployments/PackModuleMetadata";
import SplitsModuleMetadata from "../types/module-deployments/SplitsModuleMetadata";
import { ModuleMetadata, ModuleMetadataNoType } from "../types/ModuleMetadata";
import { CollectionModule } from "./collection";
import { DatastoreModule } from "./datastore";
import { DropModule } from "./drop";
import { MarketModule } from "./market";
import { NFTModule } from "./nft";
import { PackModule } from "./pack";
import { SplitsModule } from "./royalty";
import { CurrencyModule } from "./token";

/**
 * Access this module by calling {@link ThirdwebSDK.getAppModule}
 * @public
 */
export class AppModule
  extends ModuleWithRoles<ProtocolControl>
  implements IAppModule
{
  private jsonConvert = new JsonConvert();

  public static roles = [RolesMap.admin] as const;

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return CurrencyModule.roles;
  }

  /**
   * The internal module type for the app module.
   * We do not treat it as a fully fledged module on the contract level, so it does not have a real type.
   * @internal
   * @readonly
   */
  private moduleType: ModuleType = -1;

  /**
   * @internal
   */
  protected connectContract(): ProtocolControl {
    return ProtocolControl__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return this.moduleType;
  }

  /**
   * @internal
   *
   */
  private async getModuleAddress(moduleType: ModuleType): Promise<string[]> {
    return await this.readOnlyContract.getAllModulesOfType(moduleType);
  }

  private async getNFTAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.NFT);
  }

  private async getCollectionAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.COLLECTION);
  }

  private async getPackAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.PACK);
  }

  private async getCurrencyAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.CURRENCY);
  }

  private async getMarketAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.MARKET);
  }

  private async getDropAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.DROP);
  }

  private async getDatastoreAddress(): Promise<string[]> {
    return this.getModuleAddress(ModuleType.DATASTORE);
  }

  public async getRoyaltyTreasury(address?: string): Promise<string> {
    return await this.readOnlyContract.getRoyaltyTreasury(
      address || AddressZero,
    );
  }

  /**
   * @internal
   * @param addresses - The addresses of the modules to get metadata for.
   */
  public async getAllContractMetadata(
    addresses: string[],
  ): Promise<ModuleMetadataNoType[]> {
    const metadatas = await Promise.all(
      addresses.map((address) =>
        getContractMetadata(
          this.providerOrSigner,
          address,
          this.ipfsGatewayUrl,
        ),
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

  /**
   * Method to get a list of pack module metadata.
   * @returns A promise of an array of Pack modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getPackModules(): Promise<ModuleMetadata[]> {
    return (await this.getAllContractMetadata(await this.getPackAddress())).map(
      (m) => ({
        ...m,
        type: ModuleType.PACK,
      }),
    );
  }

  /**
   * Method to get a list of NFT module metadata.
   * @returns A promise of an array of NFT modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getNFTModules(): Promise<ModuleMetadata[]> {
    return (await this.getAllContractMetadata(await this.getNFTAddress())).map(
      (m) => ({
        ...m,
        type: ModuleType.NFT,
      }),
    );
  }

  /**
   * Method to get a list of Collection module metadata.
   * @returns A promise of an array of Collection modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getCollectionModules(): Promise<ModuleMetadata[]> {
    return (
      await this.getAllContractMetadata(await this.getCollectionAddress())
    ).map((m) => ({
      ...m,
      type: ModuleType.COLLECTION,
    }));
  }

  /**
   * Method to get a list of Currency module metadata.
   * @returns A promise of an array of Currency modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getCurrencyModules(): Promise<ModuleMetadata[]> {
    return (
      await this.getAllContractMetadata(await this.getCurrencyAddress())
    ).map((m) => ({
      ...m,
      type: ModuleType.CURRENCY,
    }));
  }

  /**
   * Method to get a list of Datastore module metadata.
   * @alpha
   * @returns A promise of an array of Datastore modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getDatastoreModules(): Promise<ModuleMetadata[]> {
    return (
      await this.getAllContractMetadata(await this.getDatastoreAddress())
    ).map((m) => ({
      ...m,
      type: ModuleType.DATASTORE,
    }));
  }

  /**
   * Method to get a list of Market module metadata.
   * @returns A promise of an array of Market modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getMarketModules(): Promise<ModuleMetadata[]> {
    return (
      await this.getAllContractMetadata(await this.getMarketAddress())
    ).map((m) => ({
      ...m,
      type: ModuleType.MARKET,
    }));
  }

  /**
   * Method to get a list of Drop module metadata.
   * @returns A promise of an array of Drop modules.
   * @deprecated - Use {@link AppModule.getAllModuleMetadata} instead
   */
  public async getDropModules(): Promise<ModuleMetadata[]> {
    return (await this.getAllContractMetadata(await this.getDropAddress())).map(
      (m) => ({
        ...m,
        type: ModuleType.DROP,
      }),
    );
  }

  /**
   * Method to get a list of all module metadata on a given app.
   * @public
   * @param filterByModuleType - Optional array of {@link ModuleType} to filter by.
   * @returns Array of module metadata
   */
  public async getAllModuleMetadata(
    filterByModuleType?: ModuleType[],
  ): Promise<ModuleMetadata[]> {
    const moduleTypesToGet = filterByModuleType || [
      ModuleType.NFT,
      ModuleType.COLLECTION,
      ModuleType.PACK,
      ModuleType.CURRENCY,
      ModuleType.MARKET,
      ModuleType.DROP,
      ModuleType.DATASTORE,
    ];
    return (
      await Promise.all(
        moduleTypesToGet.map(async (moduleType) => {
          const moduleAddresses = await this.getModuleAddress(moduleType);
          return (await this.getAllContractMetadata(moduleAddresses)).map(
            (m) => ({
              ...m,
              type: moduleType,
            }),
          );
        }),
      )
    ).reduce((acc, curr) => acc.concat(curr), []);
  }

  // owner functions
  /**
   * @deprecated - Use setMetadata() instead
   */
  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRoyaltyTreasury(
    treasury: string,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRoyaltyTreasury", [treasury]);
  }

  public async setModuleRoyaltyTreasury(
    moduleAddress: string,
    treasury: string,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setModuleRoyaltyTreasury", [
      moduleAddress,
      treasury,
    ]);
  }

  public async withdrawFunds(
    to: string,
    currency: string,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("withdrawFunds", [to, currency]);
  }

  /**
   * Helper method that deploys a module and returns its address
   *
   * @internal
   *
   * @param moduleType - The ModuleType to deploy
   * @param args - Constructor arguments for the module
   * @param factory - The ABI factory used to call the `deploy` method
   * @returns The address of the deployed module
   */
  private async _deployModule<T extends ModuleType>(
    moduleType: T,
    args: any[],
    factory: any,
  ): Promise<string> {
    const gasPrice = await this.sdk.getGasPrice();
    const txOpts = gasPrice
      ? { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), "gwei") }
      : {};

    const tx = await new ethers.ContractFactory(factory.abi, factory.bytecode)
      .connect(this.signer as Signer)
      .deploy(...args, txOpts);

    await tx.deployed();
    const contractAddress = tx.address;

    const addModuleTx = await this.contract.addModule(
      contractAddress,
      moduleType,
      txOpts,
    );
    await addModuleTx.wait();
    return contractAddress;
  }

  /**
   * Deploys a collection module.
   *
   * @param metadata - Metadata about the module.
   * @returns A promise with the newly created module.
   */
  public async deployBundleModule(
    metadata: BundleModuleMetadata,
  ): Promise<CollectionModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      BundleModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.COLLECTION,
      [
        this.address,
        await this.sdk.getForwarderAddress(),
        metadataUri,
        BigNumber.from(
          metadata.sellerFeeBasisPoints ? metadata.sellerFeeBasisPoints : 0,
        ),
      ],
      NFTCollection__factory,
    );

    return this.sdk.getCollectionModule(address);
  }

  /**
   * Deploys a Splits module
   *
   * @param metadata - The module metadata
   * @returns - The deployed splits module
   */
  public async deploySplitsModule(
    metadata: SplitsModuleMetadata,
  ): Promise<SplitsModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      SplitsModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.SPLITS,
      [
        this.address,
        await this.sdk.getForwarderAddress(),
        metadataUri,
        metadata.recipientSplits.map((s) => s.address),
        metadata.recipientSplits.map((s) => s.shares),
      ],
      Royalty__factory,
    );

    return this.sdk.getSplitsModule(address);
  }

  /**
   * Deploys a NFT module.
   *
   * @param metadata - The module metadata
   * @returns - The deployed NFT module
   */
  public async deployNftModule(
    metadata: NftModuleMetadata,
  ): Promise<NFTModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      NftModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.NFT,
      [
        this.address,
        metadata.name,
        metadata.symbol ? metadata.symbol : "",
        await this.sdk.getForwarderAddress(),
        metadataUri,
        metadata.sellerFeeBasisPoints,
      ],
      NFT__factory,
    );

    return this.sdk.getNFTModule(address);
  }

  /**
   * Deploys a currency module.
   *
   * @param metadata - The module metadata
   * @returns - The deployed currency module
   */
  public async deployCurrencyModule(
    metadata: CurrencyModuleMetadata,
  ): Promise<CurrencyModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      CurrencyModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.CURRENCY,
      [
        this.address,
        metadata.name,
        metadata.symbol ? metadata.symbol : "",
        await this.sdk.getForwarderAddress(),
        metadataUri,
      ],
      Coin__factory,
    );

    return this.sdk.getCurrencyModule(address);
  }

  /**
   * Deploys a Marketplace module
   *
   * @param metadata - The module metadata
   * @returns - The deployed Marketplace module
   */
  public async deployMarketModule(
    metadata: MarketModuleMetadata,
  ): Promise<MarketModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      MarketModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.MARKET,
      [
        this.address,
        await this.sdk.getForwarderAddress(),
        metadataUri,
        metadata.marketFeeBasisPoints ? metadata.marketFeeBasisPoints : 0,
      ],
      Market__factory,
    );

    return this.sdk.getMarketModule(address);
  }

  /**
   * Deploys a Pack module
   *
   * @param metadata - The module metadata
   * @returns - The deployed Pack module
   */
  public async deployPackModule(
    metadata: PackModuleMetadata,
  ): Promise<PackModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      PackModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const chainId = await this.getChainID();
    const { vrfCoordinator, linkTokenAddress, keyHash, fees } =
      ChainlinkVrf[chainId as keyof typeof ChainlinkVrf];

    const address = await this._deployModule(
      ModuleType.PACK,
      [
        this.address,
        metadataUri,
        vrfCoordinator,
        linkTokenAddress,
        keyHash,
        fees,
        await this.sdk.getForwarderAddress(),
        metadata.sellerFeeBasisPoints ? metadata.sellerFeeBasisPoints : 0,
      ],
      Pack__factory,
    );

    return this.sdk.getPackModule(address);
  }

  /**
   * Deploys a Drop module
   *
   * @param metadata - The module metadata
   * @returns - The deployed Drop module
   */
  public async deployDropModule(
    metadata: DropModuleMetadata,
  ): Promise<DropModule> {
    invariant(metadata.maxSupply !== undefined, "Max supply must be specified");
    invariant(
      metadata.primarySaleRecipientAddress !== "" &&
        isAddress(metadata.primarySaleRecipientAddress),
      "Primary sale recipient address must be specified and must be a valid address",
    );

    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      DropModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.DROP,
      [
        this.address,
        metadata.name,
        metadata.symbol ? metadata.symbol : "",
        await this.sdk.getForwarderAddress(),
        metadataUri,
        metadata.baseTokenUri ? metadata.baseTokenUri : "",
        metadata.maxSupply,
        metadata.sellerFeeBasisPoints ? metadata.sellerFeeBasisPoints : 0,
        metadata.primarySaleFeeBasisPoints
          ? metadata.primarySaleFeeBasisPoints
          : 0,
        metadata.primarySaleRecipientAddress,
      ],
      LazyNFT__factory,
    );

    return this.sdk.getDropModule(address);
  }

  /**
   * Deploys a Datastore module
   *
   * @param metadata - The module metadata
   * @returns - The deployed Datastore module
   */
  public async deployDatastoreModule(
    metadata: DatastoreModuleMetadata,
  ): Promise<DatastoreModule> {
    const serializedMetadata = this.jsonConvert.serializeObject(
      metadata,
      DatastoreModuleMetadata,
    );

    const metadataUri = await uploadMetadata(
      serializedMetadata,
      this.address,
      await this.getSignerAddress(),
    );

    const address = await this._deployModule(
      ModuleType.DATASTORE,
      [this.address, await this.sdk.getForwarderAddress(), metadataUri],
      DataStore__factory,
    );

    return this.sdk.getDatastoreModule(address);
  }
}
