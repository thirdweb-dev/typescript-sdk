import { DropERC1155, DropERC1155__factory } from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { NetworkOrSignerOrProvider } from "../core/types";
import {
  DropErc721ModuleInput,
  DropErc721ModuleOutput,
  DropErc721ModuleDeploy,
} from "../schema/modules/drop-erc721";
import { SDKOptions } from "../schema/sdk-options";

export class DropErc1155Module {
  static moduleType = "NFTBundleDrop" as const;
  static schema = {
    deploy: DropErc721ModuleInput,
    output: DropErc721ModuleOutput,
    input: DropErc721ModuleDeploy,
  } as const;

  public contractWrapper: ContractWrapper<DropERC1155>;

  public metadata: ContractMetadata<
    DropERC1155,
    typeof DropErc1155Module["schema"]
  >;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions = {},
    address: string,
  ) {
    this.contractWrapper = new ContractWrapper<DropERC1155>(
      network,
      options,
      address,
      DropERC1155__factory.abi,
    );

    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc1155Module.schema,
    );

    // this.roles = new Roles(this.contract);
    // this.royalties = new Royalties(this.contract);
  }

  public async getDrop() {
    // const token = await this.contractWrapper.readOnlyContract.tokenURI(0);
  }
}
