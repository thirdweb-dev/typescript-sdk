import { ContractInterface, ethers, providers, Signer } from "ethers";
import { IStorage } from "./interfaces/IStorage";
import { RemoteStorage } from "./classes/remote-storage";
import {
  Edition,
  EditionDrop,
  KNOWN_CONTRACTS_MAP,
  Marketplace,
  NFTCollection,
  NFTDrop,
  Pack,
  REMOTE_CONTRACT_TO_CONTRACT_TYPE,
  SignatureDrop,
  Split,
  Token,
  Vote,
} from "../contracts";
import { SDKOptions } from "../schema/sdk-options";
import { IpfsStorage } from "./classes/ipfs-storage";
import { RPCConnectionHandler } from "./classes/rpc-connection-handler";
import type {
  ConnectionInfo,
  ContractForContractType,
  ContractType,
  ValidContractInstance,
} from "./types";
import { IThirdwebContract__factory } from "contracts";
import { ContractDeployer } from "./classes/contract-deployer";
import { SmartContract } from "../contracts/smart-contract";
import invariant from "tiny-invariant";
import { TokenDrop } from "../contracts/token-drop";
import { ContractPublisher } from "./classes/contract-publisher";
import { ContractMetadata } from "./classes";
import { ChainOrRpc } from "../constants";
import { UserWallet } from "./wallet/UserWallet";
import { Multiwrap } from "../contracts/multiwrap";
import { WalletAuthenticator } from "./auth/wallet-authenticator";

/**
 * The main entry point for the thirdweb SDK
 * @public
 */
export class ThirdwebSDK extends RPCConnectionHandler {
  /**
   * Get an instance of the thirdweb SDK based on an existing ethers signer
   *
   * @example
   * ```javascript
   * // get a signer from somewhere (createRandom is being used purely for example purposes)
   * const signer = ethers.Wallet.createRandom();
   *
   * // get an instance of the SDK with the signer already setup
   * const sdk = ThirdwebSDK.fromSigner(signer, "mainnet");
   * ```
   *
   * @param signer - a ethers Signer to be used for transactions
   * @param chainId - the chainId to connect to (e.g. ChainId.Mainnet, ChainId.Rinkeby, ChainId.Polygon, ChainId.Mumbai...)
   * @param options - the SDK options to use
   * @param storage - the storage handler to use
   * @returns an instance of the SDK
   *
   * @beta
   */
  static fromSigner(
    signer: Signer,
    chainId: ChainOrRpc,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ): ThirdwebSDK {
    return new ThirdwebSDK(chainId, signer, options, storage);
  }

  /**
   * Get an instance of the thirdweb SDK based on a private key.
   *
   * @remarks
   * This should only be used for backend services or scripts, with the private key stored in a secure way.
   * **NEVER** expose your private key to the public in any way.
   *
   * @example
   * ```javascript
   * const sdk = ThirdwebSDK.fromPrivateKey("SecretPrivateKey", "mainnet");
   * ```
   *
   * @param privateKey - the private key - **DO NOT EXPOSE THIS TO THE PUBLIC**
   * @param chainId - the chainId to connect to (e.g. ChainId.Mainnet, ChainId.Rinkeby, ChainId.Polygon, ChainId.Mumbai...)
   * @param options - the SDK options to use
   * @param storage - the storage handler to use
   * @returns an instance of the SDK
   *
   * @beta
   */
  static fromPrivateKey(
    privateKey: string,
    chainId: ChainOrRpc,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ): ThirdwebSDK {
    const signer = new ethers.Wallet(privateKey);
    return ThirdwebSDK.fromSigner(signer, chainId, options, storage);
  }

  /**
   * @internal
   * the cache of contracts that we have already seen
   */
  private contractCache = new Map<
    string,
    ValidContractInstance | SmartContract
  >();
  /**
   * @internal
   * should never be accessed directly, use {@link ThirdwebSDK.getPublisher} instead
   */
  private _publisher: ContractPublisher;
  /**
   * Internal handler for uploading and downloading files
   */
  private storageHandler: IStorage;
  /**
   * New contract deployer
   */
  public deployer: ContractDeployer;
  /**
   * Interact with the connected wallet
   */
  public wallet: UserWallet;
  /**
   * Upload and download files from IPFS or from your own storage service
   */
  public storage: RemoteStorage;
  /**
   * Enable authentication with the connected wallet
   */
  public auth: WalletAuthenticator;

  constructor(
    chainId: ChainOrRpc,
    signer: Signer | undefined = undefined,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ) {
    // Throw helpful error for old usages of this constructor
    if (Signer.isSigner(chainId)) {
      throw new Error(
        "Please use 'ThirdwebSDK.fromSigner(signer, chainId)' to create a new ThirdwebSDK with a signer. Example: 'const sdk = ThirdwebSDK.fromSigner(signer, ChainId.Polygon)'",
      );
    }
    if (providers.Provider.isProvider(chainId)) {
      throw new Error(
        "Please pass in a ChainId instead of a Provider to create a new read-only ThirdwebSDK. Example: 'const sdk = new ThirdwebSDK(ChainId.Polygon)'. To initialize the SDK with a signer, use: 'ThirdwebSDK.fromSigner(signer, ChainId.Polygon)'",
      );
    }
    const connection: ConnectionInfo = {
      chainId,
      signer,
      provider: signer?.provider,
    };
    super(connection, options);
    this.storageHandler = storage;
    this.storage = new RemoteStorage(storage);
    this.deployer = new ContractDeployer(connection, options, storage);
    this.wallet = new UserWallet(connection, options);
    this.auth = new WalletAuthenticator(connection, this.wallet, options);
    this._publisher = new ContractPublisher(
      connection,
      this.options,
      this.storageHandler,
    );
    this.wallet.events.on("connected", (s: Signer) => {
      this.propagateSignerUpdated(s);
    });
  }

  /**
   * Get an instance of a Drop contract
   * @param contractAddress - the address of the deployed contract
   * @returns the contract
   */
  public getNFTDrop(contractAddress: string): NFTDrop {
    return this.getBuiltInContract(
      contractAddress,
      NFTDrop.contractType,
    ) as NFTDrop;
  }

  /**
   * Get an instance of a SignatureDrop contract
   * @param contractAddress - the address of the deployed contract
   * @returns the contract
   * @internal
   */
  public getSignatureDrop(contractAddress: string): SignatureDrop {
    return this.getBuiltInContract(
      contractAddress,
      SignatureDrop.contractType,
    ) as SignatureDrop;
  }

  /**
   * Get an instance of a NFT Collection contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getNFTCollection(address: string): NFTCollection {
    return this.getBuiltInContract(
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
    return this.getBuiltInContract(
      address,
      EditionDrop.contractType,
    ) as EditionDrop;
  }

  /**
   * Get an instance of an Edition contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getEdition(address: string): Edition {
    return this.getBuiltInContract(address, Edition.contractType) as Edition;
  }

  /**
   * Get an instance of a Token Drop contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getTokenDrop(address: string): TokenDrop {
    return this.getBuiltInContract(
      address,
      TokenDrop.contractType,
    ) as TokenDrop;
  }

  /**
   * Get an instance of a Token contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getToken(address: string): Token {
    return this.getBuiltInContract(address, Token.contractType) as Token;
  }

  /**
   * Get an instance of a Vote contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getVote(address: string): Vote {
    return this.getBuiltInContract(address, Vote.contractType) as Vote;
  }

  /**
   * Get an instance of a Splits contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getSplit(address: string): Split {
    return this.getBuiltInContract(address, Split.contractType) as Split;
  }

  /**
   * Get an instance of a Marketplace contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getMarketplace(address: string): Marketplace {
    return this.getBuiltInContract(
      address,
      Marketplace.contractType,
    ) as Marketplace;
  }

  /**
   * Get an instance of a Pack contract
   * @param address - the address of the deployed contract
   * @returns the contract
   */
  public getPack(address: string): Pack {
    return this.getBuiltInContract(address, Pack.contractType) as Pack;
  }

  /**
   * Get an instance of a Multiwrap contract
   * @param address - the address of the deployed contract
   * @returns the contract
   * @beta
   */
  public getMultiwrap(address: string): Multiwrap {
    return this.getBuiltInContract(
      address,
      Multiwrap.contractType,
    ) as Multiwrap;
  }

  /**
   *
   * @internal
   * @param address - the address of the contract to instantiate
   * @param contractType - optional, the type of contract to instantiate
   * @returns a promise that resolves with the contract instance
   */
  public getBuiltInContract<TContractType extends ContractType = ContractType>(
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

    if (contractType === "custom") {
      throw new Error(
        "To get an instance of a custom contract, use getContract(address)",
      );
    }

    const newContract = new KNOWN_CONTRACTS_MAP[
      contractType as keyof typeof KNOWN_CONTRACTS_MAP
    ](this.getConnectionInfo(), address, this.storageHandler, this.options);

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
      addresses.map(async (address) => {
        let contractType: ContractType = "custom";
        try {
          contractType = await this.resolveContractType(address);
        } catch (e) {
          // this going to happen frequently and be OK, we'll just catch it and ignore it
        }
        let metadata: ContractMetadata<any, any> | undefined;
        if (contractType === "custom") {
          try {
            metadata = (await this.getContract(address)).metadata;
          } catch (e) {
            console.log(
              `Couldn't get contract metadata for custom contract: ${address}`,
            );
          }
        } else {
          metadata = this.getBuiltInContract(address, contractType).metadata;
        }
        return {
          address,
          contractType,
          metadata,
        };
      }),
    );

    return addressesWithContractTypes
      .filter((e) => e.metadata)
      .map(({ address, contractType, metadata }) => {
        invariant(metadata, "All ThirdwebContracts require metadata");
        return {
          address,
          contractType,
          metadata: () => metadata.get(),
        };
      });
  }

  /**
   * Get an instance of a Custom ThirdwebContract
   * @param address - the address of the deployed contract
   * @returns the contract
   * @beta
   */
  public async getContract(address: string) {
    if (this.contractCache.has(address)) {
      return this.contractCache.get(address) as SmartContract;
    }
    try {
      const publisher = this.getPublisher();
      const metadata = await publisher.fetchContractMetadataFromAddress(
        address,
      );
      return this.getContractFromAbi(address, metadata.abi);
    } catch (e) {
      throw new Error(`Error fetching ABI for this contract\n\n${e}`);
    }
  }

  /**
   * Get an instance of a Custom contract from a json ABI
   * @param address - the address of the deployed contract
   * @param abi - the JSON abi
   * @returns the contract
   * @beta
   */
  public getContractFromAbi(address: string, abi: ContractInterface) {
    if (this.contractCache.has(address)) {
      return this.contractCache.get(address) as SmartContract;
    }
    const contract = new SmartContract(
      this.getConnectionInfo(),
      address,
      abi,
      this.storageHandler,
      this.options,
    );
    this.contractCache.set(address, contract);
    return contract;
  }

  /**
   * @internal
   */
  public getPublisher(): ContractPublisher {
    return this._publisher;
  }

  /**
   * Update the active signer for all contracts
   * @internal
   * @param signer
   */
  private propagateSignerUpdated(signer: Signer | undefined) {
    this.updateSigner(signer);
    this.auth.updateSigner(this.getSigner());
    this.deployer.updateSigner(this.getSigner());
    this._publisher.updateSigner(this.getSigner());
    for (const [, contract] of this.contractCache) {
      contract.onSignerUpdated(this.getSigner());
    }
  }
}
