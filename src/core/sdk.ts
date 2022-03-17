import { ContractInterface, ethers } from "ethers";
import { IStorage } from "./interfaces/IStorage";
import {
  CONTRACTS_MAP,
  Edition,
  EditionDrop,
  Marketplace,
  NFTCollection,
  NFTDrop,
  Pack,
  REMOTE_CONTRACT_TO_CONTRACT_TYPE,
  Split,
  Token,
  Vote,
} from "../contracts";
import { SDKOptions } from "../schema/sdk-options";
import { IpfsStorage } from "./classes/ipfs-storage";
import { RPCConnectionHandler } from "./classes/rpc-connection-handler";
import type {
  ContractForContractType,
  ContractType,
  NetworkOrSignerOrProvider,
  ValidContractInstance,
} from "./types";
import { IThirdwebContract__factory } from "@thirdweb-dev/contracts";
import { ContractDeployer } from "./classes/contract-deployer";
import { CustomContract } from "../contracts/custom";
import invariant from "tiny-invariant";
import { TokenDrop } from "../contracts/token-drop";

/**
 * The main entry point for the thirdweb SDK
 * @public
 */
export class ThirdwebSDK extends RPCConnectionHandler {
  /**
   * @internal
   * the cache of contracts that we have already seen
   */
  private contractCache = new Map<
    string,
    ValidContractInstance | CustomContract
  >();
  private storage: IStorage;
  /**
   * New contract deployer
   */
  public deployer: ContractDeployer;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ) {
    super(network, options);
    // this.factory = new ContractFactory(network, storage, options);
    // this.registry = new ContractRegistry(network, options);
    this.storage = storage;
    this.deployer = new ContractDeployer(network, options, storage);
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
   * Get an instance of a Edition Drop contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getEditionDrop(address: string): EditionDrop {
    return this.getContract(address, EditionDrop.contractType) as EditionDrop;
  }

  /**
   * Get an instance of an Edition contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getEdition(address: string): Edition {
    return this.getContract(address, Edition.contractType) as Edition;
  }

  /**
   * Get an instance of a Token Drop contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getTokenDrop(address: string): TokenDrop {
    return this.getContract(address, TokenDrop.contractType) as TokenDrop;
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
   *
   * @internal
   * @param address - the address of the contract to instantiate
   * @param contractType - optional, the type of contract to instantiate
   * @returns a promise that resolves with the contract instance
   */
  public getContract<TContractType extends ContractType = ContractType>(
    address: string,
    contractType: TContractType,
  ): ContractForContractType<TContractType> {
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
    return newContract as ContractForContractType<TContractType>;
  }

  /**
   * @param contractAddress - the address of the contract to attempt to resolve the contract type for
   * @returns the {@link ContractType} for the given contract address
   * @throws if the contract type cannot be determined (is not a valid thirdweb contract)
   */
  public async resolveContractType(
    contractAddress: string,
  ): Promise<ContractType> {
    const contract = IThirdwebContract__factory.connect(
      contractAddress,
      this.getSignerOrProvider(),
    );
    const remoteContractType = ethers.utils
      .toUtf8String(await contract.contractType())
      // eslint-disable-next-line no-control-regex
      .replace(/\x00/g, "");
    invariant(
      remoteContractType in REMOTE_CONTRACT_TO_CONTRACT_TYPE,
      `${remoteContractType} is not a valid contract type, falling back to custom contract`,
    );
    return REMOTE_CONTRACT_TO_CONTRACT_TYPE[
      remoteContractType as keyof typeof REMOTE_CONTRACT_TO_CONTRACT_TYPE
    ];
  }

  /**
   * Return all the contracts deployed by the specified address
   * @param walletAddress - the deployed address
   */
  public async getContractList(walletAddress: string) {
    const addresses = await (
      await this.deployer.getRegistry()
    ).getContractAddresses(walletAddress);

    const addressesWithContractTypes = await Promise.all(
      addresses.map(async (adrr) => ({
        address: adrr,
        contractType: await this.resolveContractType(adrr).catch((err) => {
          console.error(
            `failed to get contract type for address: ${adrr}`,
            err,
          );
          return "" as ContractType;
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
   * Update the active signer or provider for all contracts
   * @param network - the new signer or provider
   */
  public override updateSignerOrProvider(network: NetworkOrSignerOrProvider) {
    super.updateSignerOrProvider(network);
    this.updateContractSignerOrProvider();
  }

  private updateContractSignerOrProvider() {
    this.deployer.updateSignerOrProvider(this.getSignerOrProvider());
    for (const [, contract] of this.contractCache) {
      contract.onNetworkUpdated(this.getSignerOrProvider());
    }
  }

  /**
   * @internal
   */
  public async unstable_getCustomContract(
    address: string,
    abi: ContractInterface,
  ) {
    return new CustomContract(
      this.getSignerOrProvider(),
      address,
      abi,
      this.storage,
      this.options,
    );
  }
}
