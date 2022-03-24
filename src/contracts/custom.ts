import { ContractMetadata } from "../core/classes/contract-metadata";
import { IStorage, NetworkOrSignerOrProvider } from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  IThirdwebContract,
  IThirdwebContract__factory,
} from "@thirdweb-dev/contracts";
import { CustomContractSchema } from "../schema/contracts/custom";
import { UpdateableNetwork } from "../core/interfaces/contract";

/**
 *
 * @internal
 */
export class CustomContract implements UpdateableNetwork {
  static contractType = "custom" as const;
  static schema = CustomContractSchema;

  private contractWrapper;
  public metadata;
  private storage;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    abi: any = undefined,
    contractWrapper = new ContractWrapper<IThirdwebContract>(
      network,
      address,
      abi || IThirdwebContract__factory.abi,
      options,
    ),
  ) {
    this.storage = storage;
    this.contractWrapper = contractWrapper;
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      CustomContract.schema,
      this.storage,
    );
    // this.roles = new ContractRoles(this.contractWrapper, Edition.contractRoles);
    // this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    // this.primarySale = new ContractPrimarySale(this.contractWrapper);
    // this.encoder = new ContractEncoder(this.contractWrapper);
    // this.estimator = new GasCostEstimator(this.contractWrapper);
    // this.signature = new Erc1155SignatureMinting(
    //   this.contractWrapper,
    //   this.roles,
    //   this.storage,
    // );
  }
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }
  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }
}
