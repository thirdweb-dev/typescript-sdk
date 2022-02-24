import { IThirdwebContract } from "@thirdweb-dev/contracts";
import { z } from "zod";
import { IStorage } from "../interfaces/IStorage";
import { TransactionResult } from "../types";
import { ContractWrapper } from "./contract-wrapper";

/**
 * @internal
 */
export interface IGenericSchemaType {
  deploy: z.AnyZodObject;
  input: z.AnyZodObject;
  output: z.AnyZodObject;
}

/**
 * Handles metadata for a Contract
 * @public
 */
export class ContractMetadata<
  TContract extends IThirdwebContract,
  TSchema extends IGenericSchemaType,
> {
  private contractWrapper;
  private schema;
  private storage;

  constructor(
    contractWrapper: ContractWrapper<TContract>,
    schema: TSchema,
    storage: IStorage,
  ) {
    this.contractWrapper = contractWrapper;
    this.schema = schema;
    this.storage = storage;
  }
  /**
   * @internal
   */
  public parseOutputMetadata(metadata: any): z.output<TSchema["output"]> {
    return this.schema.output.parse(metadata);
  }

  /**
   * @internal
   */
  public parseInputMetadata(metadata: any): z.input<TSchema["input"]> {
    return this.schema.input.parse(metadata);
  }
  /**
   *
   * @returns the metadata of the given contract
   */
  public async get() {
    const uri = await this.contractWrapper.readContract.contractURI();
    const data = await this.storage.get(uri);
    return this.parseOutputMetadata(data);
  }
  /**
   *
   * @param metadata - the metadata to set
   * @returns
   */
  public async set(metadata: z.input<TSchema["input"]>) {
    const uri = await this._parseAndUploadMetadata(metadata);

    const receipt = await this.contractWrapper.sendTransaction(
      "setContractURI",
      [uri],
    );
    return { receipt, data: this.get } as TransactionResult<
      z.output<TSchema["output"]>
    >;
  }

  public async update(metadata: Partial<z.input<TSchema["input"]>>) {
    return await this.set({
      ...(await this.get()),
      ...metadata,
    });
  }

  /**
   *
   * @internal
   * @param metadata - the metadata to set
   * @returns
   */
  public async _parseAndUploadMetadata(metadata: z.input<TSchema["input"]>) {
    const parsedMetadata = this.parseInputMetadata(metadata);
    return this.storage.uploadMetadata(parsedMetadata);
  }
}
