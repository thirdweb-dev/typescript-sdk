/**
 * Things to clarify:
 *
 * Can there be > 1 `currency` condition?
 */

import { isAddress } from "@ethersproject/address";
import { AddressZero } from "@ethersproject/constants";
import { InvalidAddressError } from "../common/error";

/**
 * Expecations:
 *
 * 1. Ability to set a currency used to pay for the drop
 * 2. Configurable price
 * 3. *N* number of merkle conditions
 * 4. Configurable `quantityLimitPerTransaction
 *
 *
 *
 */

class ClaimConditionFactory {
  private _currencyAddress = "";

  constructor() {}

  public verify() {
    if (this._currencyAddress === "" || !isAddress(this._currencyAddress)) {
      throw new Error("Currency address not set");
    }
  }

  private setCurrencyAddress(address: string) {
    if (!isAddress(address)) {
      throw new InvalidAddressError(address);
    }
    this._currencyAddress = address;
  }

  /**
   * Call this method to use the native currency of the chain
   * you're deploying to as the currency for this claim.
   */
  public useNativeCurrency() {
    this.setCurrencyAddress(AddressZero);
  }

  /**
   * Call this method to use the native currency of the chain
   * you're deploying to as the currency for this claim.
   *
   * @param address - The address of the ERC20 contract to use as the currency for the claim.
   */
  public useErc20Currency(address: string) {
    this.setCurrencyAddress(address);
  }

  /**
   * Used internally when creating a drop module/updating
   * the claim conditions of a drop module.
   *
   * @internal
   *
   * @returns - The claim conditions that will be used when validating a users claim transaction.
   */
  public buildConditions(): ClaimCondition[] {
    const conditions: ClaimCondition[] = [];
    return conditions;
  }
}

export default ClaimConditionFactory;
