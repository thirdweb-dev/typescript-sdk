import { IThirdwebModule } from "@3rdweb/contracts";
import {
  ContractForModuleType,
  RemoveFileOrBuffer,
  ModuleMetadataForModuleType,
  ModuleType,
  ThirdwebModuleOrBaseContract,
} from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { z } from "zod";
import {
  recursiveResolveGatewayUrl,
  replaceIpfsWithGateway,
} from "../../common/ipfs";
import { MODULE_TYPE_TO_SCHEMA_MAP } from "../../constants/mappings";

export class BaseModule<
  TModuleType extends ModuleType = ModuleType,
> extends ContractWrapper<ContractForModuleType<TModuleType>> {
  private moduleType: Promise<TModuleType> | undefined = undefined;

  private verifyThirdwebContract(
    contract: ThirdwebModuleOrBaseContract,
  ): asserts contract is IThirdwebModule {
    if (!("contractURI" in contract)) {
      throw new Error("Contract is not a valid ThirdwebModule");
    }
  }

  private async parseMetadata(
    metadata: any,
  ): Promise<z.infer<ModuleMetadataForModuleType<TModuleType>>> {
    const moduleType = await this.getModuleType();
    if (!(moduleType in MODULE_TYPE_TO_SCHEMA_MAP)) {
      return metadata as { [key: string]: unknown };
    }
    return MODULE_TYPE_TO_SCHEMA_MAP[
      moduleType as keyof typeof MODULE_TYPE_TO_SCHEMA_MAP
    ].regular.parse(metadata) as z.infer<
      ModuleMetadataForModuleType<TModuleType>
    >;
  }

  protected async getModuleType(): Promise<TModuleType> {
    this.verifyThirdwebContract(this.readOnlyContract);
    if (!this.moduleType) {
      this.moduleType =
        this.readOnlyContract.contractURI() as Promise<TModuleType>;
    }
    return this.moduleType;
  }

  public async getMetadata(): Promise<
    RemoveFileOrBuffer<z.infer<ModuleMetadataForModuleType<TModuleType>>>
  > {
    this.verifyThirdwebContract(this.readOnlyContract);
    const uri = await this.readOnlyContract.contractURI();
    const gatewayUrl = replaceIpfsWithGateway(uri, this.options.ipfsGateway);

    const res = await fetch(gatewayUrl);
    if (!res.ok) {
      throw new Error(
        `Gateway did not return metadata, instead returned:\n${res.status} - ${res.statusText}`,
      );
    }

    return await this.parseMetadata(
      recursiveResolveGatewayUrl(await res.json(), this.options.ipfsGateway),
    );
  }

  public async setMetadata(
    metadata: z.infer<ModuleMetadataForModuleType<TModuleType>>,
  ) {
    this.verifyThirdwebContract(this.readOnlyContract);
    const parsedMetadata = await this.parseMetadata(metadata);
    const uri = this.storage.uploadMetadata(parsedMetadata);

    const tx = await this.sendTransaction("setContractURI", [uri]);
    return {
      tx,
      result: () => this.getMetadata(),
    };
  }

  public async updateMetadata(
    metadata: Partial<z.infer<ModuleMetadataForModuleType<TModuleType>>>,
  ) {
    this.verifyThirdwebContract(this.readOnlyContract);
    return this.setMetadata({ ...(await this.getMetadata()), ...metadata });
  }
}

// typescript sanity check below

const m = new BaseModule<"DropERC721">("0x0", undefined, "0x0", {} as any);

(async () => {
  const data = await m.getMetadata();
  /* OUTPUT:
    const data: OptionalDeep<{
      description?: string | undefined;
      image?: string | undefined;
      external_link?: string | undefined;
      seller_fee_basis_points?: number | undefined;
      fee_recipient?: string | undefined;
      name: string;
    }>
  */

  const setData = await m.setMetadata({ name: "foo" });
  /*
    const setData: {
      tx: TransactionReceipt;
      result: () => Promise<OptionalDeep<{
          description?: string | undefined;
          image?: string | undefined;
          external_link?: string | undefined;
          seller_fee_basis_points?: number | undefined;
          fee_recipient?: string | undefined;
          name: string;
      }>>;
    }
  */

  const updateData = await m.updateMetadata({ image: "foo" });
  /*
    const updateData: {
      tx: TransactionReceipt;
      result: () => Promise<OptionalDeep<{
          description?: string | undefined;
          image?: string | undefined;
          external_link?: string | undefined;
          seller_fee_basis_points?: number | undefined;
          fee_recipient?: string | undefined;
          name: string;
      }>>;
    }
  */
})();
