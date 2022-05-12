import { ThirdwebContract } from "contracts";
import { ContractWrapper } from "./contract-wrapper";
import { extractFunctionsFromAbi, fetchContractMetadata } from "../../common";
import { IStorage } from "../interfaces";
import {
  AbiFunction,
  AbiSchema,
  PublishedMetadata,
} from "../../schema/contracts/custom";

/**
 * Handles publish metadata for a contract
 * @internal
 */
export class ContractPublishedMetadata<TContract extends ThirdwebContract> {
  private contractWrapper;
  private storage: IStorage;

  private _cachedMetadata: PublishedMetadata | undefined;

  constructor(contractWrapper: ContractWrapper<TContract>, storage: IStorage) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Get the published metadata for this contract
   * @public
   */
  public async get(): Promise<PublishedMetadata> {
    if (this._cachedMetadata) {
      return this._cachedMetadata;
    }
    const uri = await this.contractWrapper.readContract.getPublishMetadataUri();
    this._cachedMetadata = await fetchContractMetadata(uri, this.storage);
    return this._cachedMetadata;
  }

  /**
   * @public
   */
  public extractFunctions(): AbiFunction[] {
    // to construct a contract we already **have** to have the abi on the contract wrapper, so there is no reason to look fetch it again (means this function can become synchronous as well!)
    return extractFunctionsFromAbi(AbiSchema.parse(this.contractWrapper.abi));
  }
}
