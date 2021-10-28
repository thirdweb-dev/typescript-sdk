import { keccak256 } from "@ethersproject/keccak256";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumberish } from "ethers";
import { DataStore, DataStore__factory } from "../../contract-interfaces";
import { ModuleType } from "../common";
import { Module } from "../core/module";

/**
 * The CurrencyModule. This should always be created via `getCurrencyModule()` on the main SDK.
 * @public
 */
export class DatastoreModule extends Module {
  public static moduleType: ModuleType = ModuleType.DATASTORE;

  private __contract: DataStore | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): DataStore {
    return this.__contract || this.connectContract();
  }
  private set contract(value: DataStore) {
    this.__contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): DataStore {
    return (this.contract = DataStore__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async getUint(
    key: string | number,
  ): Promise<BigNumberish | undefined> {
    const keyHash = keccak256(key.toString());
    return await this.__contract?.getUint(keyHash);
  }

  // write functions
  public async setUint(
    key: string | number,
    value: BigNumberish,
  ): Promise<TransactionReceipt> {
    const keyHash = keccak256(key.toString());
    return await this.sendTransaction("setUint", [keyHash, value]);
  }
}
