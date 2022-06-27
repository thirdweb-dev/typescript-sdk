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
  ChainAndAddress,
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
import {
  ChainIdOrName,
  chainNameToId,
  getProviderForChain,
  NATIVE_TOKEN_ADDRESS,
  toChainId,
} from "../constants";
import { UserWallet } from "./wallet/UserWallet";
import { Multiwrap } from "../contracts/multiwrap";
import { WalletAuthenticator } from "./auth/wallet-authenticator";
import { CurrencyValue } from "../types/index";
import { fetchCurrencyValue } from "../common/currency";

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
   * @param chain - the chainId to connect to (e.g. ChainId.Mainnet, ChainId.Rinkeby, ChainId.Polygon, ChainId.Mumbai...)
   * @param options - the SDK options to use
   * @param storage - the storage handler to use
   * @returns an instance of the SDK
   *
   * @beta
   */
  static fromSigner(
    signer: Signer,
    chain: ChainIdOrName,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ): ThirdwebSDK {
    const sdk = new ThirdwebSDK(chain, options, storage);
    sdk.wallet.connect(signer);
    return sdk;
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
   * @param chain - the chainId to connect to (e.g. ChainId.Mainnet, ChainId.Rinkeby, ChainId.Polygon, ChainId.Mumbai...)
   * @param options - the SDK options to use
   * @param storage - the storage handler to use
   * @returns an instance of the SDK
   *
   * @beta
   */
  static fromPrivateKey(
    privateKey: string,
    chain: ChainIdOrName,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ): ThirdwebSDK {
    const chainId = toChainId(chain);
    const provider = getProviderForChain(chainId, options.chainIdToRPCUrlMap);
    const signer = new ethers.Wallet(privateKey, provider);
    return ThirdwebSDK.fromSigner(signer, chainId, options, storage);
  }

  /**
   * @internal
   * the cache of contracts that we have already seen
   */
  private contractCache = new Map<
    ChainAndAddress,
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
    chain: ChainIdOrName,
    options: SDKOptions = {},
    storage: IStorage = new IpfsStorage(),
  ) {
    // Throw helpful error for old usages of this constructor
    verifyInputs(chain);
    const chainId = toChainId(chain);
    const connection: ConnectionInfo = {
      chainId,
      signer: undefined,
      provider: undefined,
    };
    super(connection, options);
    this.storageHandler = storage;
    this.storage = new RemoteStorage(storage);
    this.deployer = new ContractDeployer(
      this.getConnectionInfo(),
      options,
      storage,
    );
    this.wallet = new UserWallet(this.getConnectionInfo(), options);
    this.auth = new WalletAuthenticator(
      this.getConnectionInfo(),
      this.wallet,
      options,
    );
    this._publisher = new ContractPublisher(
      this.getConnectionInfo(),
      this.options,
      this.storageHandler,
    );
    // when there is a new signer connected in the wallet sdk, update that signer
    this.wallet.events.on("connected", (s) => {
      this.propagateSignerUpdated(s);
    });
    // when the wallet disconnects, update the signer to undefined
    this.wallet.events.on("disconnected", () => {
      this.propagateSignerUpdated(undefined);
    });
  }

  /**
   * Get an instance of a Drop contract
   * @param contractAddress - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getNFTDrop(
    contractAddress: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<NFTDrop> {
    return this.getBuiltInContract<"nft-drop">(
      contractAddress,
      NFTDrop.contractType,
      chain,
    );
  }

  /**
   * Get an instance of a SignatureDrop contract
   * @param contractAddress - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   * @internal
   */
  public async getSignatureDrop(
    contractAddress: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<SignatureDrop> {
    return this.getBuiltInContract<"signature-drop">(
      contractAddress,
      SignatureDrop.contractType,
      chain,
    );
  }

  /**
   * Get an instance of a NFT Collection contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getNFTCollection(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<NFTCollection> {
    return this.getBuiltInContract<"nft-collection">(
      address,
      NFTCollection.contractType,
      chain,
    );
  }

  /**
   * Get an instance of a Edition Drop contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getEditionDrop(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<EditionDrop> {
    return this.getBuiltInContract<"edition-drop">(
      address,
      EditionDrop.contractType,
      chain,
    );
  }

  /**
   * Get an instance of an Edition contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getEdition(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Edition> {
    return this.getBuiltInContract<"edition">(
      address,
      Edition.contractType,
      chain,
    );
  }

  /**
   * Get an instance of a Token Drop contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getTokenDrop(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<TokenDrop> {
    return this.getBuiltInContract<"token-drop">(
      address,
      TokenDrop.contractType,
      chain,
    );
  }

  /**
   * Get an instance of a Token contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getToken(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Token> {
    return this.getBuiltInContract<"token">(address, Token.contractType, chain);
  }

  /**
   * Get an instance of a Vote contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getVote(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Vote> {
    return this.getBuiltInContract<"vote">(address, Vote.contractType, chain);
  }

  /**
   * Get an instance of a Splits contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getSplit(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Split> {
    return this.getBuiltInContract<"split">(address, Split.contractType, chain);
  }

  /**
   * Get an instance of a Marketplace contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getMarketplace(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Marketplace> {
    return this.getBuiltInContract<"marketplace">(
      address,
      Marketplace.contractType,
      chain,
    );
  }

  /**
   * Get an instance of a Pack contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   */
  public async getPack(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Pack> {
    return this.getBuiltInContract<"pack">(address, Pack.contractType, chain);
  }

  /**
   * Get an instance of a Multiwrap contract
   * @param address - the address of the deployed contract
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns the contract
   * @beta
   */
  public async getMultiwrap(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<Multiwrap> {
    return this.getBuiltInContract<"multiwrap">(
      address,
      Multiwrap.contractType,
      chain,
    );
  }

  /**
   *
   * @internal
   * @param address - the address of the contract to instantiate
   * @param contractType - the type of contract to instantiate
   * @param chain - optional, chain (id or name) of the contract (defaults to the chain the SDK is connected to)
   * @returns a promise that resolves with the contract instance
   */
  public async getBuiltInContract<
    TContractType extends ContractType = ContractType,
  >(
    address: string,
    contractType: TContractType,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ) {
    const chainId = toChainId(chain);
    // if we have a contract in the cache we will return it
    // we will do this **without** checking any contract type things for simplicity, this may have to change in the future?
    if (this.contractCache.has({ chainId, address })) {
      return this.contractCache.get({
        chainId,
        address,
      }) as ContractForContractType<TContractType>;
    }

    if (contractType === "custom") {
      throw new Error(
        "To get an instance of a custom contract, use getContract(address)",
      );
    }

    let connectionInfo = this.getConnectionInfo();
    if (chainId !== this.getConnectionInfo().chainId) {
      connectionInfo = {
        chainId,
        provider: undefined,
        signer: connectionInfo.signer,
      };
    }

    const newContract = new KNOWN_CONTRACTS_MAP[
      contractType as keyof typeof KNOWN_CONTRACTS_MAP
    ](connectionInfo, address, this.storageHandler, this.options);

    this.contractCache.set({ chainId, address }, newContract);

    // return the new contract
    return newContract as ContractForContractType<TContractType>;
  }

  /**
   * @param contractAddress - the address of the contract to attempt to resolve the contract type for
   * @param chain - optional the chain (id or name) of the contract (defaults to the SDK chainId)
   * @returns the {@link ContractType} for the given contract address
   * @throws if the contract type cannot be determined (is not a valid thirdweb contract)
   */
  public async resolveContractType(
    contractAddress: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ): Promise<ContractType> {
    const chainId = toChainId(chain);
    const contract = IThirdwebContract__factory.connect(
      contractAddress,
      getProviderForChain(chainId, this.options.chainIdToRPCUrlMap),
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
   * @param chain - the chain to fetch from contracts from
   */
  public async getContractList(
    walletAddress: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ) {
    const registry = await this.deployer.getRegistry(chain);
    const addresses = await registry.getContractAddresses(walletAddress);

    const addressesWithContractTypes = await Promise.all(
      addresses.map(async (address) => {
        let contractType: ContractType = "custom";
        try {
          contractType = await this.resolveContractType(address, chain);
        } catch (e) {
          // this going to happen frequently and be OK, we'll just catch it and ignore it
        }
        let metadata: ContractMetadata<any, any> | undefined;
        if (contractType === "custom") {
          try {
            metadata = (await this.getContract(address, chain)).metadata;
          } catch (e) {
            console.log(
              `Couldn't get contract metadata for custom contract: ${address}`,
            );
          }
        } else {
          const builtInContract = await this.getBuiltInContract(
            address,
            contractType,
            chain,
          );
          metadata = builtInContract.metadata;
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
   * @param chain - optional the chain (id or name) of the contract (defaults to the SDK chainId)
   * @returns the contract
   * @beta
   */
  public async getContract(
    address: string,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ) {
    const chainId = toChainId(chain);
    if (this.contractCache.has({ chainId, address })) {
      return this.contractCache.get({ chainId, address }) as SmartContract;
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
   * @param chain - optional the chain (id or name) of the contract (defaults to the SDK chainId)
   * @returns the contract
   * @beta
   */
  public getContractFromAbi(
    address: string,
    abi: ContractInterface,
    chain: ChainIdOrName = this.getConnectionInfo().chainId,
  ) {
    const chainId = toChainId(chain);
    if (this.contractCache.has({ chainId, address })) {
      return this.contractCache.get({ chainId, address }) as SmartContract;
    }
    let connectionInfo = this.getConnectionInfo();
    if (chainId !== this.getConnectionInfo().chainId) {
      connectionInfo = {
        chainId,
        provider: undefined,
        signer: connectionInfo.signer,
      };
    }
    const contract = new SmartContract(
      connectionInfo,
      address,
      abi,
      this.storageHandler,
      this.options,
    );
    this.contractCache.set({ chainId, address }, contract);
    return contract;
  }

  /**
   * Get the native balance of a given address (wallet or contract)
   * @example
   * ```javascript
   * const balance = await sdk.getBalance("0x...");
   * console.log(balance.displayValue);
   * ```
   * @param address - the address to check the balance for
   */
  public async getBalance(address: string): Promise<CurrencyValue> {
    return fetchCurrencyValue(
      this.getProvider(),
      NATIVE_TOKEN_ADDRESS,
      await this.getProvider().getBalance(address),
    );
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

/**
 * @internal
 * @param chain
 */
function verifyInputs(chain: ChainIdOrName) {
  if (Signer.isSigner(chain)) {
    throw new Error(
      "Please use 'ThirdwebSDK.fromSigner(signer, chainId)' or 'ThirdwebSDK.fromPrivateKey(privateKey, chainId)' to create a new ThirdwebSDK that can perform transactions. Example: 'const sdk = ThirdwebSDK.fromSigner(signer, ChainId.Polygon)'",
    );
  }
  if (providers.Provider.isProvider(chain)) {
    throw new Error(
      "Please pass in a ChainId instead of a Provider to create a new read-only ThirdwebSDK. Example: 'const sdk = new ThirdwebSDK(ChainId.Polygon)'. To initialize the SDK with a signer, use: 'ThirdwebSDK.fromSigner(signer, ChainId.Polygon)'",
    );
  }
  if (typeof chain === "string" && chainNameToId[chain] === undefined) {
    if (chain.startsWith("http") || chain.startsWith("ws")) {
      throw new Error(
        `Please pass in a ChainId instead of an RPC url. RPC urls for each ChainId can be configured via SDKOptions. Ex: 'const sdk = new ThirdwebSDK(ChainId.Mainnet, { chainIdToRPCUrlMap: { ChainId.Mainnet: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY" });'`,
      );
    }
    throw new Error(
      `Unknown chain name: ${chain}. Please pass a valid ChainId instead. eg. 'ChainId.Rinkeby' or '80001'`,
    );
  }
}
