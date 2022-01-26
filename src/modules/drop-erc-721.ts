import { RoleName, RolesMap } from "../common/role";
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
import { SDKOptions } from "../schema/sdk-options";

export class DropErc721Module {
  static moduleType = "NFTDrop" as const;
  static schema = {
    deploy: DropErc721ModuleInput,
    output: DropErc721ModuleOutput,
    input: DropErc721ModuleDeploy,
  } as const;

  private static moduleRoles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.transfer,
  ] as RoleName[];

  private contractWrapper;
  public metadata;
  public roles;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions = {},
    address: string,
  ) {
    this.contractWrapper = new ContractWrapper<DropERC721>(
      network,
      options,
      address,
      DropERC721__factory.abi,
    );
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc721Module.schema,
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
