import { ThirdwebContract } from "@thirdweb-dev/contracts";
import { ContractWrapper } from "./contract-wrapper";
import { extractFunctionsFromAbi, fetchContractMetadata } from "../../common";
import { IStorage } from "../interfaces";
import { AbiFunction, PublishedMetadata } from "../../schema/contracts/custom";

/**
 * Handles primary sales recipients for a Contract
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
  public async extractFunctions(): Promise<AbiFunction[]> {
    const abi = (await this.get()).abi;
    return extractFunctionsFromAbi(abi);
  }
}
