import { IThirdwebModule } from "@3rdweb/contracts";
import { BaseContract } from "@ethersproject/contracts";
import { z } from "zod";
import { ThirdwebModuleOrBaseContract } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { IpfsStorage } from "./ipfs-storage";

interface IGenericSchemaType {
  deploy: z.AnyZodObject;
  input: z.AnyZodObject;
  output: z.AnyZodObject;
}

export class ContractMetadata<
  TContract extends BaseContract,
  TSchema extends IGenericSchemaType,
> {
  private contractWrapper;
  private schema;
  private storage;

  constructor(
    contractWrapper: ContractWrapper<TContract>,
    schema: TSchema,
    storage: IpfsStorage,
  ) {
    this.contractWrapper = contractWrapper;
    this.schema = schema;
    this.storage = storage;
  }

  private verifyThirdwebContract(
    contract: ThirdwebModuleOrBaseContract,
  ): asserts contract is IThirdwebModule {
    if (!("contractURI" in contract)) {
      throw new Error("Contract is not a valid ThirdwebModule");
    }
  }

  private parseOutputMetadata(metadata: any): z.infer<TSchema["output"]> {
    return this.schema.output.passthrough().parse(metadata);
  }

  private parseInputMetadata(metadata: any): z.infer<TSchema["input"]> {
    return this.schema.input.parse(metadata);
  }
  /**
   *
   * @returns the metadata of the given module
   */
  public async get() {
    this.verifyThirdwebContract(this.contractWrapper.readOnlyContract);
    const uri = await this.contractWrapper.readOnlyContract.contractURI();
    const data = await this.storage.get(uri);

    return this.parseOutputMetadata(JSON.parse(data));
  }

  /**
   *
   * @param metadata - the metadata to set
   * @returns
   */
  public async set(metadata: z.infer<TSchema["input"]>) {
    const parsedMetadata = this.parseInputMetadata(metadata);
    const uri = this.storage.uploadMetadata(parsedMetadata);

    const transaction = await this.contractWrapper.sendTransaction(
      "setContractURI",
      [uri],
    );
    return {
      transaction,
      metadata: () => this.get(),
    };
  }

  public async update(metadata: Partial<z.infer<TSchema["input"]>>) {
    return await this.set({
      ...(await this.get()),
      ...metadata,
    });
  }
}
