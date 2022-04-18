import { ThirdwebContract } from "@thirdweb-dev/contracts";
import { ContractWrapper } from "./contract-wrapper";
import { fetchContractMetadata } from "../../common";
import { IStorage } from "../interfaces";

/**
 * Handles primary sales recipients for a Contract
 * @public
 */
export class ContractPublishedMetadata<TContract extends ThirdwebContract> {
  private contractWrapper;
  private storage: IStorage;

  constructor(contractWrapper: ContractWrapper<TContract>, storage: IStorage) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Get the published metadata for this contract
   * @public
   */
  public async get() {
    const uri = await this.contractWrapper.readContract.getPublishMetadataUri();
    return fetchContractMetadata(uri, this.storage);
  }
}
