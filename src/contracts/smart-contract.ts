import { ContractMetadata } from "../core/classes/contract-metadata";
import {
  ContractEvents,
  ContractInterceptor,
  ContractPrimarySale,
  ContractRoles,
  ContractRoyalty,
  Erc1155,
  Erc20,
  Erc721,
  GasCostEstimator,
  IStorage,
  NetworkOrSignerOrProvider,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  IPermissionsEnumerable,
  IPlatformFee,
  IPrimarySale,
  IRoyalty,
  ThirdwebContract,
} from "contracts";
import { CustomContractSchema } from "../schema/contracts/custom";
import { UpdateableNetwork } from "../core/interfaces/contract";
import { ContractInterface } from "ethers";
import { ALL_ROLES, detectContractFeature } from "../common";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";
import { ContractPublishedMetadata } from "../core/classes/contract-published-metadata";
import { BaseERC1155, BaseERC20, BaseERC721 } from "../types/eips";
import { ContractAnalytics } from "../core/classes/contract-analytics";

/**
 * Custom contract dynamic class with feature detection
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getContract("{{contract_address}}");
 *
 * // call any function in your contract
 * await contract.functions.myCustomFunction(params);
 *
 * // if your contract follows the ERC721 standard, contract.nft will be present
 * const allNFTs = await contract.nft.query.all()
 *
 * // if your contract extends IMintableERC721, contract.nft.mint will be present
 * const tx = await contract.nft.mint.to("0x...", {
 *     name: "Cool NFT",
 *     image: readFileSync("some_image.png"),
 *   });
 * ```
 *
 * @beta
 */
export class SmartContract<
  TContract extends ThirdwebContract = ThirdwebContract,
> implements UpdateableNetwork
{
  static contractType = "custom" as const;
  /**
   * @internal
   */
  static schema = CustomContractSchema;

  private contractWrapper;
  private storage;
  private options;

  // raw contract
  /**
   * Call any function in this contract using the function signature
   * ex: contract.functions.mint(address, quantity)
   */
  public readonly functions: any;

  // utilities
  public events: ContractEvents<TContract>;
  public interceptor: ContractInterceptor<TContract>;
  public estimator: GasCostEstimator<TContract>;
  public publishedMetadata: ContractPublishedMetadata<TContract>;
  protected analytics: ContractAnalytics<TContract>;

  // features
  public metadata: ContractMetadata<ThirdwebContract, any> | undefined;
  public royalties:
    | ContractRoyalty<IRoyalty & ThirdwebContract, any>
    | undefined;
  public roles: ContractRoles<IPermissionsEnumerable, any> | undefined;
  public sales: ContractPrimarySale<IPrimarySale> | undefined;
  public platformFees: ContractPlatformFee<IPlatformFee> | undefined;
  /**
   * Auto-detects ERC20 standard functions.
   */
  public token: Erc20 | undefined;
  /**
   * Auto-detects ERC721 standard functions.
   */
  public nft: Erc721 | undefined;
  /**
   * Auto-detects ERC1155 standard functions.
   */
  public edition: Erc1155 | undefined;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    abi: ContractInterface,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TContract>(
      network,
      address,
      abi,
      options,
    ),
  ) {
    this.options = options;
    this.storage = storage;
    this.contractWrapper = contractWrapper;
    this.functions = contractWrapper.writeContract;

    this.events = new ContractEvents(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.publishedMetadata = new ContractPublishedMetadata(
      this.contractWrapper,
      this.storage,
    );

    this.metadata = new ContractMetadata(
      this.contractWrapper,
      SmartContract.schema,
      this.storage,
    );

    this.analytics = new ContractAnalytics(this.contractWrapper);

    // feature detection
    this.royalties = this.detectRoyalties();
    this.roles = this.detectRoles();
    this.sales = this.detectPrimarySales();
    this.platformFees = this.detectPlatformFees();

    this.token = this.detectErc20();
    this.nft = this.detectErc721();
    this.edition = this.detectErc1155();

    // TODO detect sigmint
    // this.sigmint = this.detectSigmint();
  }

  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }

  /** ********************
   * FEATURE DETECTION
   * ********************/

  private detectRoyalties() {
    // TODO (byoc) change to ThirdwebContract
    if (
      detectContractFeature<IRoyalty & ThirdwebContract>(
        this.contractWrapper,
        "Royalty",
      )
    ) {
      // ContractMetadata is stateless, it's fine to create a new one here
      // This also makes it not order dependent in the feature detection process
      const metadata = new ContractMetadata(
        this.contractWrapper,
        SmartContract.schema,
        this.storage,
      );
      return new ContractRoyalty(this.contractWrapper, metadata);
    }
    return undefined;
  }

  private detectRoles() {
    if (
      detectContractFeature<IPermissionsEnumerable>(
        this.contractWrapper,
        "Permissions",
      )
    ) {
      return new ContractRoles(this.contractWrapper, ALL_ROLES);
    }
    return undefined;
  }

  private detectPrimarySales() {
    if (
      detectContractFeature<IPrimarySale>(this.contractWrapper, "PrimarySale")
    ) {
      return new ContractPrimarySale(this.contractWrapper);
    }
    return undefined;
  }

  private detectPlatformFees() {
    if (
      detectContractFeature<IPlatformFee>(this.contractWrapper, "PlatformFee")
    ) {
      return new ContractPlatformFee(this.contractWrapper);
    }
    return undefined;
  }

  private detectErc20() {
    if (detectContractFeature<BaseERC20>(this.contractWrapper, "ERC20")) {
      return new Erc20(this.contractWrapper, this.storage, this.options);
    }
    return undefined;
  }

  private detectErc721() {
    if (detectContractFeature<BaseERC721>(this.contractWrapper, "ERC721")) {
      return new Erc721(this.contractWrapper, this.storage, this.options);
    }
    return undefined;
  }

  private detectErc1155() {
    if (detectContractFeature<BaseERC1155>(this.contractWrapper, "ERC1155")) {
      return new Erc1155(this.contractWrapper, this.storage, this.options);
    }
    return undefined;
  }
}
