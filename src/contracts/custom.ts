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
import { BaseContract } from "ethers";

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
    abi: any = IThirdwebContract__factory.abi,
    contractWrapper = new ContractWrapper<BaseContract>(
      network,
      address,
      abi,
      options,
    ),
  ) {
    this.storage = storage;
    this.contractWrapper = contractWrapper;

    if (supportsContractMetadata(this.contractWrapper)) {
      this.metadata = new ContractMetadata(
        this.contractWrapper,
        CustomContract.schema,
        this.storage,
      );
    }
  }
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }
  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }
}

function supportsContractMetadata(
  contractWrapper: ContractWrapper<BaseContract>,
): contractWrapper is ContractWrapper<IThirdwebContract> {
  return (
    "contractURI" in contractWrapper.readContract &&
    "setContractURI" in contractWrapper.readContract.functions
  );
}
