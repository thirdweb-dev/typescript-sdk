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
import { SDKOptions, SDKOptionsSchema } from "../schema/sdk-options";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import {
  DropErc721TokenInput,
  DropErc721TokenOutput,
} from "../schema/tokens/drop-erc721";

export class DropErc721Module {
  static moduleType = "NFTDrop" as const;
  static schema = {
    deploy: DropErc721ModuleDeploy,
    output: DropErc721ModuleOutput,
    input: DropErc721ModuleInput,
    tokenInput: DropErc721TokenInput,
    tokenOutput: DropErc721TokenOutput,
  } as const;

  // this is a type of readoyly Role[], technically, doing it this way makes it work nicely for types
  // **but** we probably want to enforce in an interface somewhere that `static moduleRoles` is a type of Role[]
  public static moduleRoles = ["admin", "minter", "transfer"] as const;

  private contractWrapper;
  private options;
  public metadata;
  public roles;
  public royalty;

  public updateSignerOrProvider;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    options: SDKOptions = {},
  ) {
    try {
      this.options = SDKOptionsSchema.parse(options);
    } catch (optionParseError) {
      console.error(
        "invalid module options object passed, falling back to default options",
        optionParseError,
      );
      this.options = SDKOptionsSchema.parse({});
    }

    this.contractWrapper = new ContractWrapper<DropERC721>(
      network,
      address,
      DropERC721__factory.abi,
      options,
    );
    // expose **only** the updateSignerOrProvider function from the private contractWrapper publicly
    this.updateSignerOrProvider = this.contractWrapper.updateSignerOrProvider;

    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc721Module.schema,
      this.options.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      DropErc721Module.moduleRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
  }
}

/**
 *  JUST TS SANITY CHECK BELOW
 */

// (async () => {
//   const module = new DropErc721Module("1", "0x0");

//   const metdata = await module.metadata.get();

//   const txResult = await module.metadata.set({ name: "foo" });
//   const metadata = await txResult.metadata();

//   // const parsedInput = DropErc721Module.schema.tokenInput.parse({ test: "foo" });

//   // const parsedOutput = module.parseTokenOutput(parsedInput);
// })();
