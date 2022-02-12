import { ethers } from "ethers";
import { IStorage } from "./interfaces/IStorage";
import {
  DropErc1155Contract,
  DropErc721Contract,
  MarketplaceContract,
  CONTRACTS_MAP,
  SplitsContract,
  TokenErc20Contract,
  VoteContract,
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
import { TokenErc721Contract } from "../contracts/token-erc-721";
import { TokenErc1155Contract } from "../contracts/token-erc-1155";
import { ContractRegistry } from "./classes/registry";
import { PacksContract } from "../contracts/packs";
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
      new ContractRegistry(registryAddress, this.getNetwork(), this.options),
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
        this.getNetwork(),
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
      this.getProvider(),
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
    ](this.getNetwork(), address, this.storage, this.options);
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
  public getDropContract(contractAddress: string): DropErc721Contract {
    return this.getContract(
      contractAddress,
      DropErc721Contract.contractType,
    ) as DropErc721Contract;
  }

  /**
   * Get an instance of a NFT Collection contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getNFTContract(address: string): TokenErc721Contract {
    return this.getContract(
      address,
      TokenErc721Contract.contractType,
    ) as TokenErc721Contract;
  }

  /**
   * Get an instance of a Bundle Drop contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getBundleDropContract(address: string): DropErc1155Contract {
    return this.getContract(
      address,
      DropErc1155Contract.contractType,
    ) as DropErc1155Contract;
  }

  /**
   * Get an instance of a Bundle contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getBundleContract(address: string): TokenErc1155Contract {
    return this.getContract(
      address,
      TokenErc1155Contract.contractType,
    ) as TokenErc1155Contract;
  }

  /**
   * Get an instance of a Token contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getTokenContract(address: string): TokenErc20Contract {
    return this.getContract(
      address,
      TokenErc20Contract.contractType,
    ) as TokenErc20Contract;
  }

  /**
   * Get an instance of a Vote contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getVoteContract(address: string): VoteContract {
    return this.getContract(address, VoteContract.contractType) as VoteContract;
  }

  /**
   * Get an instance of a Splits contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getSplitsContract(address: string): SplitsContract {
    return this.getContract(
      address,
      SplitsContract.contractType,
    ) as SplitsContract;
  }

  /**
   * Get an instance of a Marketplace contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getMarketplaceContract(address: string): MarketplaceContract {
    return this.getContract(
      address,
      MarketplaceContract.contractType,
    ) as MarketplaceContract;
  }

  /**
   * Get an instance of a Pack contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getPackContract(address: string): PacksContract {
    return this.getContract(
      address,
      PacksContract.contractType,
    ) as PacksContract;
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
      factory.updateSignerOrProvider(this.getSigner() || this.getProvider());
    });
    // has to be promises now
    this._registry?.then((registry) => {
      registry.updateSignerOrProvider(this.getSigner() || this.getProvider());
    });

    for (const [, contract] of this.contractCache) {
      contract.onNetworkUpdated(this.getSigner() || this.getProvider());
    }
  }
}

// BELOW ARE TYPESCRIPT SANITY CHECKS

// (async () => {
//   const sdk = new ThirdwebSDK("1");

//   const dropContract = sdk.getDropContract("0x0");
//   // metadata
//   const metadata = await dropContract.metadata.get();
//   const updated = await dropContract.metadata.update({
//     name: "foo",
//     seller_fee_basis_points: 1,
//   });
//   const transaction = updated.transaction;
//   const data = await updated.metadata();

//   // roles
//   const roles = await dropContract.roles.getAllMembers();
//   const adminAddrs = await dropContract.roles.getRoleMembers("admin");

//   // royalty
//   const royalty = await dropContract.royalty.getRoyaltyInfo();

//   const updatedRoyalty = await dropContract.royalty.setRoyaltyInfo({
//     fee_recipient: "0x0",
//     seller_fee_basis_points: 500,
//   });

//   const transaction2 = updatedRoyalty.transaction;
//   // metadata key doesn't really make sense here? hm.
//   const data2 = await updatedRoyalty.metadata();
// })();
