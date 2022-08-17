import { IAppURI } from "contracts";
import { ContractWrapper } from "./contract-wrapper";
import { TransactionResult } from "../types";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { FEATURE_APP_URI } from "../../constants/thirdweb-features";

/**
 * Have an official Application URI for this contract.
 * @remarks Configure an official Application URI for this contract.
 * @example
 * ```javascript
 * const contract = await sdk.getContract("{{contract_address}}");
 * const appURI = await contract.appURI.get();
 * appURI = "ipfs://some_ipfs_hash";
 *
 * await contract.platformFee.set(appURI)
 * ```
 * @public
 */
export class ContractAppURI<TContract extends IAppURI>
  implements DetectableFeature
{
  featureName = FEATURE_APP_URI.name;
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * Get the appURI for the contract
   * @returns the wallet address.
   */
  public async get() {
    return await this.contractWrapper.readContract.appURI();
  }

  /**
   * Set the appURI for the contract
   * @param appURI - the uri to set (typically an IPFS hash)
   */
  public async set(appURI: string): Promise<TransactionResult> {
    // TODO make it work with ContractMetadata
    // if (detectContractFeature(this.contractWrapper, "AppURI"))
    return {
      receipt: await this.contractWrapper.sendTransaction("setAppURI", [
        appURI,
      ]),
    };
  }
}
