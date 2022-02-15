import { ethers } from "ethers";
import { IStorage } from "./interfaces/IStorage";
import {
  NFTStackDrop,
  Marketplace,
  CONTRACTS_MAP,
  Split,
  Token,
  Vote,
  NFTDrop,
} from "../contracts";
import { SDKOptions } from "../schema/sdk-options";
import { ContractFactory } from "./classes/factory";
import { IpfsStorage } from "./classes/ipfs-storage";
import { RPCConnectionHandler } from "./classes/rpc-connection-handler";
import type {
  ContractForContractType,
  ContractType,
  NetworkOrSignerOrProvider,
  ValidContractClass,
  ValidContractInstance,
} from "./types";
import { NFTCollection } from "../contracts/nft-collection";
import { NFTStackCollection } from "../contracts/nft-stack-collection";
import { ContractRegistry } from "./classes/registry";
import { Pack } from "../contracts/pack";
import { getContractAddressByChainId } from "../constants/addresses";
import { z } from "zod";
import { IThirdwebContract__factory } from "@3rdweb/contracts";

/**
 * The main entry point for the thirdweb SDK
 */
export class ThirdwebSDK extends RPCConnectionHandler {
  /**
   * @internal
   * the cache of contracts that we have already seen
   */
  private contractCache = new Map<string, ValidContractInstance>();
  /**
   * @internal
   * should never be accessed directly, use {@link getFactory} instead
   */
  private _factory: Promise<ContractFactory> | undefined;
  /**
   * @internal
   * should never be accessed directly, use {@link getRegistry} instead
   */
  private _registry: Promise<ContractRegistry> | undefined;

  public storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage = new IpfsStorage(),
  ) {
    super(network, options);
    // this.factory = new ContractFactory(network, storage, options);
    // this.registry = new ContractRegistry(network, options);
    this.storage = storage;
  }

  private async getRegistry(): Promise<ContractRegistry> {
    // if we already have a registry just return it back
    if (this._registry) {
      return this._registry;
    }
    // otherwise get the registry address for the active chain and get a new one
    const chainId = (await this.getProvider().getNetwork()).chainId;
    const registryAddress = getContractAddressByChainId(chainId, "twRegistry");
    return (this._registry = Promise.resolve(
      new ContractRegistry(registryAddress, this.getProvider(), this.options),
    ));
  }

  private async getFactory(): Promise<ContractFactory> {
    // if we already have a factory just return it back
    if (this._factory) {
      return this._factory;
    }
    // otherwise get the factory address for the active chain and get a new one
    const chainId = (await this.getProvider().getNetwork()).chainId;
    const factoryAddress = getContractAddressByChainId(chainId, "twFactory");
    return (this._factory = Promise.resolve(
      new ContractFactory(
        factoryAddress,
        this.getSignerOrProvider(),
        this.storage,
        this.options,
      ),
    ));
  }

  /**
   * Deploys a new contract
   *
   * @param contractType - the type of contract to deploy
   * @param contractMetadata - the metadata to deploy the contract with
   * @returns a promise of the address of the newly deployed contract
   */
  public async deployContract<TContract extends ValidContractClass>(
    contractType: TContract["contractType"],
    contractMetadata: z.input<TContract["schema"]["deploy"]>,
  ): Promise<string> {
    const factory = await this.getFactory();
    return await factory.deploy(contractType, contractMetadata);
  }

  /**
   *
   * @param contractAddress - the address of the contract to attempt to resolve the contract type for
   * @returns the {@link ContractType} for the given contract address
   * @throws if the contract type cannot be determined (is not a valid thirdweb contract)
   */
  public async resolveContractType<TContractType extends ContractType>(
    contractAddress: string,
  ) {
    const contract = IThirdwebContract__factory.connect(
      contractAddress,
      this.getSignerOrProvider(),
    );
    return (
      ethers.utils
        .toUtf8String(await contract.contractType())
        // eslint-disable-next-line no-control-regex
        .replace(/\x00/g, "") as TContractType
    );
  }

  public async getContractList(walletAddress: string) {
    const addresses = await (
      await this.getRegistry()
    ).getContractAddresses(walletAddress);

    const addressesWithContractTypes = await Promise.all(
      addresses.map(async (adrr) => ({
        address: adrr,
        contractType: await this.resolveContractType(adrr).catch((err) => {
          console.error(
            `failed to get contract type for address: ${adrr}`,
            err,
          );
          return "DropERC721" as ContractType;
        }),
      })),
    );

    return addressesWithContractTypes.map(({ address, contractType }) => ({
      address,
      contractType,
      metadata: () => this.getContract(address, contractType).metadata.get(),
    }));
  }

  /**
   *
   * @internal
   * @param address - the address of the contract to instantiate
   * @param contractType - optional, the type of contract to instantiate
   * @returns a promise that resolves with the contract instance
   */
  public getContract<TContractType extends ContractType = ContractType>(
    address: string,
    contractType: TContractType,
  ) {
    // if we have a contract in the cache we will return it
    // we will do this **without** checking any contract type things for simplicity, this may have to change in the future?
    if (this.contractCache.has(address)) {
      return this.contractCache.get(
        address,
      ) as ContractForContractType<TContractType>;
    }
    const newContract = new CONTRACTS_MAP[
      // we have to do this as here because typescript is not smart enough to figure out
      // that the type is a key of the map (checked by the if statement above)
      contractType as keyof typeof CONTRACTS_MAP
    ](this.getSignerOrProvider(), address, this.storage, this.options);
    // if we have a contract type && the contract type is part of the map

    this.contractCache.set(address, newContract);

    // return the new contract
    return newContract;
  }

  /**
   * Get an instance of a Drop contract
   * @param contractAddress - the address of the deployed contract
   * @returns the contract
   */
  public getNFTDrop(contractAddress: string): NFTDrop {
    return this.getContract(contractAddress, NFTDrop.contractType) as NFTDrop;
  }

  /**
   * Get an instance of a NFT Collection contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getNFTCollection(address: string): NFTCollection {
    return this.getContract(
      address,
      NFTCollection.contractType,
    ) as NFTCollection;
  }

  /**
   * Get an instance of a Bundle Drop contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getNFTStackDrop(address: string): NFTStackDrop {
    return this.getContract(address, NFTStackDrop.contractType) as NFTStackDrop;
  }

  /**
   * Get an instance of a Bundle contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getNFTStackCollection(address: string): NFTStackCollection {
    return this.getContract(
      address,
      NFTStackCollection.contractType,
    ) as NFTStackCollection;
  }

  /**
   * Get an instance of a Token contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getToken(address: string): Token {
    return this.getContract(address, Token.contractType) as Token;
  }

  /**
   * Get an instance of a Vote contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getVote(address: string): Vote {
    return this.getContract(address, Vote.contractType) as Vote;
  }

  /**
   * Get an instance of a Splits contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getSplit(address: string): Split {
    return this.getContract(address, Split.contractType) as Split;
  }

  /**
   * Get an instance of a Marketplace contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getMarketplace(address: string): Marketplace {
    return this.getContract(address, Marketplace.contractType) as Marketplace;
  }

  /**
   * Get an instance of a Pack contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getPack(address: string): Pack {
    return this.getContract(address, Pack.contractType) as Pack;
  }

  /**
   * Update the active signer or provider for all contracts
   * @param network - the new signer or provider
   */
  public override updateSignerOrProvider(network: NetworkOrSignerOrProvider) {
    super.updateSignerOrProvider(network);
    this.updateContractSignerOrProvider();
  }

  private updateContractSignerOrProvider() {
    // has to be promises now
    this._factory?.then((factory) => {
      factory.updateSignerOrProvider(this.getSignerOrProvider());
    });
    // has to be promises now
    this._registry?.then((registry) => {
      registry.updateSignerOrProvider(this.getSignerOrProvider());
    });

    for (const [, contract] of this.contractCache) {
      contract.onNetworkUpdated(this.getSignerOrProvider());
    }
  }
}
