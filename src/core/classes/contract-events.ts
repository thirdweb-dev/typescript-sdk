import { ContractWrapper } from "./contract-wrapper";
import { BaseContract } from "ethers";
import { Listener } from "@ethersproject/providers";

/**
 * Listen to Contract events in real time
 * @public
 */
export class ContractEvents<TContract extends BaseContract> {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * Subscribe to contract events
   * @remarks Add a listener for a particular contract event
   * @example
   * ```javascript
   * contract.events.addListener("TokensMinted", (event) => {
   *   console.log(event);
   * });
   * ```
   * @public
   * @param eventName - the event name as defined in the contract
   * @param listener - the receiver that will be called on every new event
   */
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

  /**
   * @public
   * @param eventName - the event name as defined in the contract
   * @param listener - the listener to unregister
   */
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

  /**
   * Remove all listeners on this contract
   */
  public removeAllListeners() {
    this.contractWrapper.readContract.removeAllListeners();
  }
}
