import { ContractMetadata } from "../core/classes/contract-metadata";
import {
  ContractPrimarySale,
  ContractRoles,
  ContractRoyalty,
  IStorage,
  NetworkOrSignerOrProvider,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  AccessControlEnumerable,
  AccessControlEnumerable__factory,
  IThirdwebContract,
  IThirdwebContract__factory,
  IThirdwebPlatformFee,
  IThirdwebPlatformFee__factory,
  IThirdwebPrimarySale,
  IThirdwebPrimarySale__factory,
  IThirdwebRoyalty,
  IThirdwebRoyalty__factory,
} from "@thirdweb-dev/contracts";
import { CustomContractSchema } from "../schema/contracts/custom";
import { UpdateableNetwork } from "../core/interfaces/contract";
import { BaseContract, ContractInterface } from "ethers";
import { ALL_ROLES } from "../common";
import { implementsInterface } from "../common/feature-detection";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";

/**
 * Custom contract wrapper with feature detection
 * @internal
 */
export class CustomContract<TContract extends BaseContract = BaseContract>
  implements UpdateableNetwork
{
  static contractType = "custom" as const;
  static schema = CustomContractSchema;

  private contractWrapper;
  private storage;

  public metadata;
  public royalties;
  public roles;
  public sales;
  public platformFees;

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
    this.storage = storage;
    this.contractWrapper = contractWrapper;

    this.metadata = this.detectMetadata();
    this.royalties = this.detectRoyalties();
    this.roles = this.detectRoles();
    this.sales = this.detectPrimarySales();
    this.platformFees = this.detectPlatformFees();

    // TODO detect token standards - requires contract interface cleanups
  }

  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }

  /** ****************************
   * FEATURE DETECTION
   ******************************/

  private detectMetadata() {
    if (
      implementsInterface<IThirdwebContract>(
        this.contractWrapper,
        IThirdwebContract__factory.createInterface(),
      )
    ) {
      return new ContractMetadata(
        this.contractWrapper,
        CustomContract.schema,
        this.storage,
      );
    }
    return undefined;
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
}
