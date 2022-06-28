import { ConnectionInfo, ValidContractClass } from "../types";
import { z } from "zod";
import { ContractRegistry } from "./registry";
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
  SignatureDrop,
  Split,
  Token,
  Vote,
} from "../../contracts";
import {
  MarketplaceContractDeployMetadata,
  MultiwrapContractDeployMetadata,
  NFTContractDeployMetadata,
  SplitContractDeployMetadata,
  TokenContractDeployMetadata,
  VoteContractDeployMetadata,
} from "../../types/deploy/deploy-metadata";
import { TokenDrop } from "../../contracts/token-drop";
import { Multiwrap } from "../../contracts/multiwrap";
import { Signer } from "ethers";
import { ChainIdOrName, toChainId } from "../../constants/index";

/**
 * Handles deploying new contracts
 * @public
 */
export class ContractDeployer extends RPCConnectionHandler {
  private registryCache = new Map<number, ContractRegistry>();
  private factoryCache = new Map<number, ContractFactory>();
  private storage: IStorage;

  constructor(
    connection: ConnectionInfo,
    options: SDKOptions,
    storage: IStorage,
  ) {
    super(connection, options);
    this.storage = storage;
  }

  /**
   * Deploys an NFT Collection contract
   *
   * @remarks Deploys an NFT Collection contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployNFTCollection({
   *   name: "My Collection",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployNFTCollection(
    metadata: NFTContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      NFTCollection.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new NFTDrop contract
   *
   * @remarks Deploys an NFT Drop contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployNFTDrop({
   *   name: "My Drop",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployNFTDrop(
    metadata: NFTContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      NFTDrop.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new SignatureDrop contract
   *
   * @remarks Deploys a SignatureDrop contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deploySignatureDrop({
   *   name: "My Signature Drop",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   * @internal
   */
  public async deploySignatureDrop(
    metadata: NFTContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      SignatureDrop.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Multiwrap contract
   *
   * @remarks Deploys a Multiwrap contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployMultiwrap({
   *   name: "My Multiwrap",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   * @beta
   */
  public async deployMultiwrap(
    metadata: MultiwrapContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      Multiwrap.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Edition contract
   *
   * @remarks Deploys an Edition contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployEdition({
   *   name: "My Edition",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployEdition(
    metadata: NFTContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      Edition.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new EditionDrop contract
   *
   * @remarks Deploys an Edition Drop contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployEditionDrop({
   *   name: "My Edition Drop",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployEditionDrop(
    metadata: NFTContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      EditionDrop.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Token contract
   *
   * @remarks Deploys a Token contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployToken({
   *   name: "My Token",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployToken(
    metadata: TokenContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      Token.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Token Drop contract
   *
   * @remarks Deploys a Token Drop contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployTokenDrop({
   *   name: "My Token Drop",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployTokenDrop(
    metadata: TokenContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      TokenDrop.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Marketplace contract
   *
   * @remarks Deploys a Marketplace contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployMarketplace({
   *   name: "My Marketplace",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployMarketplace(
    metadata: MarketplaceContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      Marketplace.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Pack contract
   *
   * @remarks Deploys a Pack contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployPack({
   *   name: "My Pack",
   *   primary_sale_recipient: "your-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployPack(
    metadata: NFTContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(Pack.contractType, metadata, chain);
  }

  /**
   * Deploys a new Split contract
   *
   * @remarks Deploys a Split contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deploySplit({
   *   name: "My Split",
   *   primary_sale_recipient: "your-address",
   *   recipients: [
   *    {
   *      address: "your-address",
   *      sharesBps: 80 * 100, // 80%
   *    },
   *    {
   *      address: "another-address",
   *      sharesBps: 20 * 100, // 20%
   *    },
   *   ],
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deploySplit(
    metadata: SplitContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(
      Split.contractType,
      metadata,
      chain,
    );
  }

  /**
   * Deploys a new Vote contract
   *
   * @remarks Deploys an Vote contract and returns the address of the deployed contract
   *
   * @example
   * ```javascript
   * const contractAddress = await sdk.deployer.deployVote({
   *   name: "My Vote",
   *   primary_sale_recipient: "your-address",
   *   voting_token_address: "your-token-contract-address",
   * });
   * ```
   * @param metadata - the contract metadata
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns the address of the deployed contract
   */
  public async deployVote(
    metadata: VoteContractDeployMetadata,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    return await this.deployBuiltInContract(Vote.contractType, metadata, chain);
  }

  /**
   * Deploys a new contract
   *
   * @internal
   * @param contractType - the type of contract to deploy
   * @param contractMetadata - the metadata to deploy the contract with
   * @param chain - the chain to deploy the contract to, defaults to the chain the SDK is connected to
   * @returns a promise of the address of the newly deployed contract
   */
  public async deployBuiltInContract<TContract extends ValidContractClass>(
    contractType: TContract["contractType"],
    contractMetadata: z.input<TContract["schema"]["deploy"]>,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<string> {
    const factory = await this.getFactory(chain);
    return await factory.deploy(contractType, contractMetadata);
  }

  /**
   * @internal
   */
  public async getRegistry(
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<ContractRegistry> {
    const chainId = toChainId(chain);
    if (this.registryCache.has(chainId)) {
      return this.registryCache.get(chainId) as ContractRegistry;
    }
    let connectionInfo = this.getConnectionInfo();
    if (chainId !== this.getConnectionInfo().chainId) {
      connectionInfo = {
        chainId,
        provider: undefined,
        signer: connectionInfo.signer,
      };
    }
    const registry = new ContractRegistry(connectionInfo, this.options);
    this.registryCache.set(chainId, registry);
    return registry;
  }

  private async getFactory(
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<ContractFactory> {
    const chainId = toChainId(chain);
    if (this.factoryCache.has(chainId)) {
      return this.factoryCache.get(chainId) as ContractFactory;
    }
    let connectionInfo = this.getConnectionInfo();
    if (chainId !== this.getConnectionInfo().chainId) {
      connectionInfo = {
        chainId,
        provider: undefined,
        signer: connectionInfo.signer,
      };
    }
    const factory = new ContractFactory(
      connectionInfo,
      this.storage,
      this.options,
    );
    this.factoryCache.set(chainId, factory);
    return factory;
  }

  public override updateSigner(signer: Signer | undefined) {
    super.updateSigner(signer);
    for (const [, contract] of this.registryCache) {
      contract.updateSigner(this.getSigner());
    }
    for (const [, contract] of this.factoryCache) {
      contract.updateSigner(this.getSigner());
    }
  }
}
