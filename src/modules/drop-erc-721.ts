import { Role } from "../common/role";
import { DropERC721, DropERC721__factory } from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { NetworkOrSignerOrProvider } from "../core/types";
import {
  DropErc721ModuleInput,
  DropErc721ModuleOutput,
  DropErc721ModuleDeploy,
} from "../schema/modules/drop-erc721";
import { SDKOptionsOutput } from "../schema/sdk-options";

export class DropErc721Module {
  static moduleType = "NFTDrop" as const;
  static schema = {
    deploy: DropErc721ModuleInput,
    output: DropErc721ModuleOutput,
    input: DropErc721ModuleDeploy,
  } as const;

  public static moduleRoles = [
    "admin",
    "minter",
    "transfer",
  ] as readonly Role[];

  private contractWrapper;
  public metadata;
  public roles;

  public updateSignerOrProvider;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptionsOutput,
    address: string,
  ) {
    this.contractWrapper = new ContractWrapper<DropERC721>(
      network,
      options,
      address,
      DropERC721__factory.abi,
    );
    // expose **only** the updateSignerOrProvider function from the private contractWrapper publicly
    this.updateSignerOrProvider = this.contractWrapper.updateSignerOrProvider;

    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc721Module.schema,
      options.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      DropErc721Module.moduleRoles,
    );
    // this.royalties = new Royalties(this.contract);
  }

  public async getDrop() {
    // const token = await this.contractWrapper.readOnlyContract.tokenURI(0);
  }
}
