import { NetworkOrSignerOrProvider, ValidContractClass } from "../types";
import { z } from "zod";
import { ContractRegistry } from "./registry";
import { getContractAddressByChainId } from "../../constants/addresses";
import { ContractFactory } from "./factory";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces";
import { RPCConnectionHandler } from "./rpc-connection-handler";
import {
  Edition,
  EditionDrop,
  Marketplace,
  NFTCollection,
  NFTDrop,
  Pack,
  Split,
  Token,
  Vote,
} from "../../contracts";
import {
  MarketplaceContractDeployMetadata,
  NFTContractDeployMetadata,
  SplitContractDeployMetadata,
  TokenContractDeployMetadata,
  VoteContractDeployMetadata,
} from "../../types/deploy/deploy-metadata";
import { TokenDrop } from "../../contracts/token-drop";

/**
 * Handles deploying new contracts
 * @public
 */
export class ContractDeployer extends RPCConnectionHandler {
  /**
   * @internal
   * should never be accessed directly, use {@link ContractDeployer.getFactory} instead
   */
  private _factory: Promise<ContractFactory> | undefined;
  /**
   * @internal
   * should never be accessed directly, use {@link ContractDeployer.getRegistry} instead
   */
  private _registry: Promise<ContractRegistry> | undefined;
  private storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage,
  ) {
    super(network, options);
    this.storage = storage;
  }

  /**
   * Deploys a new NFTCollection contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployNFTCollection(
    metadata: NFTContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(NFTCollection.contractType, metadata);
  }

  /**
   * Deploys a new NFTDrop contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployNFTDrop(
    metadata: NFTContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(NFTDrop.contractType, metadata);
  }

  /**
   * Deploys a new Edition contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployEdition(
    metadata: NFTContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(Edition.contractType, metadata);
  }

  /**
   * Deploys a new EditionDrop contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployEditionDrop(
    metadata: NFTContractDeployMetadata,
  ): Promise<string> {
    const parsed = EditionDrop.schema.deploy.parse(metadata);
    return await this.deployContract(EditionDrop.contractType, parsed);
  }

  /**
   * Deploys a new Token contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployToken(
    metadata: TokenContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(Token.contractType, metadata);
  }

  /**
   * Deploys a new Token Drop contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployTokenDrop(
    metadata: TokenContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(TokenDrop.contractType, metadata);
  }

  /**
   * Deploys a new Marketplace contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployMarketplace(
    metadata: MarketplaceContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(Marketplace.contractType, metadata);
  }

  /**
   * Deploys a new Pack contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployPack(
    metadata: NFTContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(Pack.contractType, metadata);
  }

  /**
   * Deploys a new Split contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deploySplit(
    metadata: SplitContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(Split.contractType, metadata);
  }

  /**
   * Deploys a new Vote contract
   * @param metadata - the contract metadata
   * @returns the address of the deployed contract
   */
  public async deployVote(
    metadata: VoteContractDeployMetadata,
  ): Promise<string> {
    return await this.deployContract(Vote.contractType, metadata);
  }

  /**
   * Deploys a new contract
   *
   * @internal
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
   * @internal
   */
  public async getRegistry(): Promise<ContractRegistry> {
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
  }
}
