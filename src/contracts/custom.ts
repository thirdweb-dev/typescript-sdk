import { ContractMetadata } from "../core/classes/contract-metadata";
import {
  ContractPrimarySale,
  ContractRoles,
  ContractRoyalty,
  Erc20,
  Erc721,
  IStorage,
  NetworkOrSignerOrProvider,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  AccessControlEnumerable,
  AccessControlEnumerable__factory,
  IThirdwebContract,
  IThirdwebPlatformFee,
  IThirdwebPlatformFee__factory,
  IThirdwebPrimarySale,
  IThirdwebPrimarySale__factory,
  IThirdwebRoyalty,
  IThirdwebRoyalty__factory,
  ITokenERC20,
  ITokenERC20__factory,
  ITokenERC721,
  ITokenERC721__factory,
  ThirdwebContract,
  ThirdwebContract__factory,
} from "@thirdweb-dev/contracts";
import { CustomContractSchema } from "../schema/contracts/custom";
import { UpdateableNetwork } from "../core/interfaces/contract";
import { ContractInterface } from "ethers";
import { ALL_ROLES } from "../common";
import { implementsInterface } from "../common/feature-detection";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";

/**
 * Custom contract wrapper with feature detection
 * @internal
 */
export class CustomContract<
  TContract extends ThirdwebContract = ThirdwebContract,
> implements UpdateableNetwork
{
  static contractType = "custom" as const;
  static schema = CustomContractSchema;
  static contractFactory = ThirdwebContract__factory;

  private contractWrapper;
  private storage;
  private options;

  public metadata;
  public royalties;
  public roles;
  public sales;
  public platformFees;
  public token: Erc20<ITokenERC20> | undefined;
  public nft: Erc721<ITokenERC721> | undefined;

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

    this.metadata = new ContractMetadata(
      this.contractWrapper,
      CustomContract.schema,
      this.storage,
    );
    this.royalties = this.detectRoyalties();
    this.roles = this.detectRoles();
    this.sales = this.detectPrimarySales();
    this.platformFees = this.detectPlatformFees();

    this.token = this.detectErc20();
    this.nft = this.detectErc721();
    // TODO detect 1155
    // this.erc20 = this.detectErc1155();

    // TODO detect sigmint
    // this.sigmint = this.detectSigmint();
  }

  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }
  private detectRoyalties() {
    if (
      implementsInterface<IThirdwebContract & IThirdwebRoyalty>(
        this.contractWrapper,
        IThirdwebRoyalty__factory.createInterface(),
      )
    ) {
      // ContractMetadata is stateless, it's fine to create a new one here
      // This also makes it not order dependent in the feature detection process
      const metadata = new ContractMetadata(
        this.contractWrapper,
        CustomContract.schema,
        this.storage,
      );
      return new ContractRoyalty(this.contractWrapper, metadata);
    }
    return undefined;
  }

  private detectRoles() {
    if (
      implementsInterface<AccessControlEnumerable>(
        this.contractWrapper,
        AccessControlEnumerable__factory.createInterface(),
      )
    ) {
      return new ContractRoles(this.contractWrapper, ALL_ROLES);
    }
    return undefined;
  }

  private detectPrimarySales() {
    if (
      implementsInterface<IThirdwebPrimarySale>(
        this.contractWrapper,
        IThirdwebPrimarySale__factory.createInterface(),
      )
    ) {
      return new ContractPrimarySale(this.contractWrapper);
    }
    return undefined;
  }

  private detectPlatformFees() {
    if (
      implementsInterface<IThirdwebPlatformFee>(
        this.contractWrapper,
        IThirdwebPlatformFee__factory.createInterface(),
      )
    ) {
      return new ContractPlatformFee(this.contractWrapper);
    }
    return undefined;
  }

  private detectErc20() {
    // TODO this should work for drop contracts too
    if (
      implementsInterface<ITokenERC20>(
        this.contractWrapper,
        ITokenERC20__factory.createInterface(),
      )
    ) {
      return new Erc20(this.contractWrapper, this.storage, this.options);
    }
    return undefined;
  }

  private detectErc721() {
    // TODO this should work for drop contracts too
    if (
      implementsInterface<ITokenERC721>(
        this.contractWrapper,
        ITokenERC721__factory.createInterface(),
      )
    ) {
      return new Erc721(this.contractWrapper, this.storage, this.options);
    }
    return undefined;
  }
}
