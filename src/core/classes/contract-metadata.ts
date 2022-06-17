import { IContractMetadata } from "contracts";
import { z } from "zod";
import { IStorage } from "../interfaces/IStorage";
import { TransactionResult } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import {
  detectContractFeature,
  fetchContractMetadataFromAddress,
} from "../../common";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { FEATURE_METADATA } from "../../constants/thirdweb-features";
import { BaseContract } from "ethers";

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
 * @remarks Read and update metadata for this contract
 * @example
 * ```javascript
 * const contract = await sdk.getContract("{{contract_address}}");
 * const metadata = await contract.metadata.get();
 * await contract.metadata.set({
 *   name: "My Contract",
 *   description: "My contract description"
 * })
 * ```
 * @public
 */
export class ContractMetadata<
  TContract extends BaseContract,
  TSchema extends IGenericSchemaType,
> implements DetectableFeature
{
  featureName = FEATURE_METADATA.name;
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
    let uri;
    let data;
    try {
      if (this.supportsContractMetadata(this.contractWrapper)) {
        uri = await this.contractWrapper.readContract.contractURI();
        data = await this.storage.get(uri);
      }
    } catch (e) {
      // ignore
    }

    if (!data) {
      try {
        // try fetching metadata from bytecode
        data = await fetchContractMetadataFromAddress(
          this.contractWrapper.readContract.address,
          this.contractWrapper.getProvider(),
          this.storage,
        );
      } catch (e) {
        // ignore
      }
    }

    if (!data) {
      throw new Error("Contract does not support reading contract metadata");
    }

    return this.parseOutputMetadata(data);
  }
  /**
   *
   * @param metadata - the metadata to set
   * @returns
   */
  public async set(metadata: z.input<TSchema["input"]>) {
    const uri = await this._parseAndUploadMetadata(metadata);

    const wrapper = this.contractWrapper;
    if (this.supportsContractMetadata(wrapper)) {
      const receipt = await wrapper.sendTransaction("setContractURI", [uri]);
      return { receipt, data: this.get } as TransactionResult<
        z.output<TSchema["output"]>
      >;
    } else {
      throw new Error("Contract does not support updating contract metadata");
    }
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

  private supportsContractMetadata(
    contractWrapper: ContractWrapper<any>,
  ): contractWrapper is ContractWrapper<IContractMetadata> {
    return detectContractFeature<IContractMetadata>(
      contractWrapper,
      "ContractMetadata",
    );
  }
}
