import { ContractWrapper } from "./contract-wrapper";
import { BaseContract } from "ethers";
import { Listener } from "@ethersproject/providers";

/**
 * Encodes and decodes Contract functions
 * @public
 */
export class ContractEvents<TContract extends BaseContract> {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  public addListener(
    eventName: keyof TContract["filters"],
    listener: (event: Record<string, any>) => void,
  ) {
    // validates event, throws error if not found
    const event = this.contractWrapper.readContract.interface.getEvent(
      eventName as string,
    );
    this.contractWrapper.readContract.on(event.name, (...args) => {
      // convert event info into nice object with named properties
      const results: Record<string, any> = {};
      event.inputs
        .map((i) => i.name)
        .forEach((arg, index) => {
          results[arg] = args[index];
        });
      listener(results);
    });
  }

  public removeListener(
    eventName: keyof TContract["filters"],
    listener: Listener,
  ) {
    // validates event, throws error if not found
    const event = this.contractWrapper.readContract.interface.getEvent(
      eventName as string,
    );
    this.contractWrapper.readContract.off(event.name as string, listener);
  }

  public removeAllListeners() {
    this.contractWrapper.readContract.removeAllListeners();
  }
}
