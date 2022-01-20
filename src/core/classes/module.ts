import { IThirdwebModule } from "@3rdweb/contracts";
import {
  ContractForModuleType,
  ModuleType,
  ThirdwebModuleOrBaseContract,
  InputModuleMetadataForModuleType,
  OutputModuleMetadataForModuleType,
} from "../types";
import { ContractWrapper } from "./contract-wrapper";
import {
  recursiveResolveGatewayUrl,
  replaceIpfsWithGateway,
} from "../../common/ipfs";
import { MODULE_TYPE_TO_SCHEMA_MAP } from "../../constants/mappings";
import { JsonObject } from "../../schema/shared";

export class BaseModule<
  TModuleType extends ModuleType = ModuleType,
> extends ContractWrapper<ContractForModuleType<TModuleType>> {
  private moduleType: Promise<TModuleType> | undefined = undefined;

  protected verifyThirdwebContract(
    contract: ThirdwebModuleOrBaseContract,
  ): asserts contract is IThirdwebModule {
    if (!("contractURI" in contract)) {
      throw new Error("Contract is not a valid ThirdwebModule");
    }
  }

  private async parseMetadata<
    TInputOutput extends "input" | "output" = "output",
  >(metadata: any, inputOrOutput?: TInputOutput) {
    const moduleType = await this.getModuleType();

    if (moduleType in MODULE_TYPE_TO_SCHEMA_MAP) {
      const mType = moduleType as keyof typeof MODULE_TYPE_TO_SCHEMA_MAP;
      const parser =
        MODULE_TYPE_TO_SCHEMA_MAP[mType][inputOrOutput || "output"];
      return parser
        .passthrough()
        .parse(metadata) as TInputOutput extends "input"
        ? InputModuleMetadataForModuleType<TModuleType>
        : OutputModuleMetadataForModuleType<TModuleType>;
    }
    return JsonObject.parse(metadata) as TInputOutput extends "input"
      ? InputModuleMetadataForModuleType<TModuleType>
      : OutputModuleMetadataForModuleType<TModuleType>;
  }

  protected async getModuleType(): Promise<TModuleType> {
    this.verifyThirdwebContract(this.readOnlyContract);
    if (!this.moduleType) {
      this.moduleType =
        this.readOnlyContract.contractURI() as Promise<TModuleType>;
    }
    return this.moduleType;
  }

  /**
   *
   * @returns the metadata of the given module
   */
  public async getMetadata() {
    this.verifyThirdwebContract(this.readOnlyContract);
    const uri = await this.readOnlyContract.contractURI();
    const gatewayUrl = replaceIpfsWithGateway(uri, this.options.ipfsGateway);

    const res = await fetch(gatewayUrl);
    return await this.parseMetadata(
      recursiveResolveGatewayUrl(await res.json(), this.options.ipfsGateway),
    );
  }

  /**
   *
   * @param metadata - the metadata to set
   * @returns
   */
  public async setMetadata(
    metadata: InputModuleMetadataForModuleType<TModuleType>,
  ) {
    this.verifyThirdwebContract(this.readOnlyContract);
    const parsedMetadata = await this.parseMetadata(metadata, "input");
    const uri = this.storage.uploadMetadata(parsedMetadata);

    const tx = await this.sendTransaction("setContractURI", [uri]);
    return {
      tx,
      result: () => this.getMetadata(),
    };
  }

  public async updateMetadata(
    metadata: Partial<InputModuleMetadataForModuleType<TModuleType>>,
  ) {
    this.verifyThirdwebContract(this.readOnlyContract);
    return await this.setMetadata({
      ...(await this.getMetadata()),
      ...metadata,
    });
  }
}

// typescript sanity check below

// const m = new BaseModule<"DropERC721">("0x0", undefined, "0x0", {} as any);

// (async () => {
//   const data = await m.getMetadata();

//   /* OUTPUT:
//     const data: OptionalDeep<{
//       description?: string | undefined;
//       image?: string | undefined;
//       external_link?: string | undefined;
//       seller_fee_basis_points?: number | undefined;
//       fee_recipient?: string | undefined;
//       name: string;
//     }>
//   */

//   const setData = await m.setMetadata({ name: "foo" });
//   /*
//     const setData: {
//       tx: TransactionReceipt;
//       result: () => Promise<OptionalDeep<{
//           description?: string | undefined;
//           image?: string | undefined;
//           external_link?: string | undefined;
//           seller_fee_basis_points?: number | undefined;
//           fee_recipient?: string | undefined;
//           name: string;
//       }>>;
//     }
//   */

//   const updateData = await m.updateMetadata({ image: "foo" });
//   /*
//     const updateData: {
//       tx: TransactionReceipt;
//       result: () => Promise<OptionalDeep<{
//           description?: string | undefined;
//           image?: string | undefined;
//           external_link?: string | undefined;
//           seller_fee_basis_points?: number | undefined;
//           fee_recipient?: string | undefined;
//           name: string;
//       }>>;
//     }
//   */
// })();
