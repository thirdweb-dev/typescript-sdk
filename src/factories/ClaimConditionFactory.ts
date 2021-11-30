/**
 * Things to clarify:
 *
 * Can there be > 1 `currency` condition?
 */

import { isAddress } from "@ethersproject/address";
import { BytesLike, hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { BigNumberish } from "ethers";
import { InvalidAddressError } from "../common/error";
import { invariant } from "../common/invariant";
import { PublicMintCondition } from "../types/claim-conditions/PublicMintCondition";

/**
 * Expecations:
 *
 * 1. Ability to set a currency used to pay for the drop
 * 2. Configurable price
 * 3. *N* number of merkle conditions
 * 4. Configurable `quantityLimitPerTransaction
 *
 */

class ClaimConditionFactory {
  private _currencyAddress = "";
  // TODO: Should this be in seconds? Or milliseconds?
  private _currencyConditionStartTime = Date.now();

  private _price: BigNumberish = 0;
  // TODO: Should this be in seconds? Or milliseconds?
  private _priceConditionStartTime = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  public verify() {
    if (this._currencyAddress === "" || !isAddress(this._currencyAddress)) {
      throw new Error("Currency address not set");
    }
  }

  private setCurrencyAddress(address: string, startTime?: Date) {
    if (!isAddress(address)) {
      throw new InvalidAddressError(address);
    }

    this._currencyAddress = address;
    this._currencyConditionStartTime = startTime?.getTime() || Date.now();
  }

  /**
   * Call this method to use the native currency of the chain
   * you're deploying to as the currency for this claim.
   */
  public useNativeCurrency(startTime?: Date): ClaimConditionFactory {
    this.setCurrencyAddress(AddressZero, startTime);
    return this;
  }

  /**
   * Call this method to use the native currency of the chain
   * you're deploying to as the currency for this claim.
   *
   * @param address - The address of the ERC20 contract to use as the currency for the claim.
   */
  public useErc20Currency(
    address: string,
    startTime?: Date,
  ): ClaimConditionFactory {
    this.setCurrencyAddress(address, startTime);
    return this;
  }

  /**
   * Set the price claim condition for the drop.
   *
   * @param price - The price of the currency in wei. Must be >= 0.
   */
  public setPrice(
    price: BigNumberish,
    startTime?: Date,
  ): ClaimConditionFactory {
    invariant(price >= 0, "Price cannot be negative");

    this._price = price;
    this._priceConditionStartTime = startTime?.getTime() || Date.now();
    return this;
  }

  /**
   * Used internally when creating a drop module/updating
   * the claim conditions of a drop module.
   *
   * @internal
   *
   * @returns - The claim conditions that will be used when validating a users claim transaction.
   */
  public buildConditions(): PublicMintCondition[] {
    const conditions: PublicMintCondition[] = [];

    if (this._currencyAddress) {
      conditions.push(
        this.buildPublicClaimCondition({
          currency: this._currencyAddress,
          startTimestampInSeconds: this._currencyConditionStartTime,
        }),
      );
    }

    if (this._price) {
      conditions.push(
        this.buildPublicClaimCondition({
          pricePerToken: this._price,
          startTimestampInSeconds: this._priceConditionStartTime,
        }),
      );

      // pricePerToken: this._price,
      // startTimestamp: this._priceConditionStartTime,
    }

    return conditions;
  }

  /**
   * Helper method that provides defaults for each claim condition.
   * @internal
   */
  private buildPublicClaimCondition(c: {
    pricePerToken?: BigNumberish;
    startTimestampInSeconds?: BigNumberish;
    maxMintSupply?: BigNumberish;
    currentMintSupply?: BigNumberish;
    quantityLimitPerTransaction?: BigNumberish;
    waitTimeSecondsLimitPerTransaction?: BigNumberish;
    merkleRoot?: BytesLike;
    currency?: string;
  }): PublicMintCondition {
    return {
      startTimestamp: c.startTimestampInSeconds || 0,
      maxMintSupply: c.maxMintSupply || 0,
      currentMintSupply: 0,
      // TODO: I don't understand this default value
      quantityLimitPerTransaction:
        c.quantityLimitPerTransaction || c.maxMintSupply || 0,
      waitTimeSecondsLimitPerTransaction:
        c.waitTimeSecondsLimitPerTransaction || 0,
      pricePerToken: c.pricePerToken || 0,
      currency: c.currency || AddressZero,
      merkleRoot: c.merkleRoot || hexZeroPad([0], 32),
    };
  }

  /**
   * Currently supports loading:
   *
   * 1. The currency address, if set
   * 2. The price per token, if set
   *
   * @param conditions - The conditions to load, should be returned directly from the contract.
   * @returns - The loaded claim condition factory.
   */
  public fromPublicMintConditions(conditions: PublicMintCondition[]) {
    for (const condition of conditions) {
      if (condition.currency && condition.currency === AddressZero) {
        this.useNativeCurrency();
      } else if (condition.currency) {
        this.useErc20Currency(condition.currency);
      }

      if (condition.pricePerToken) {
        this.setPrice(condition.pricePerToken);
      }
    }
    return this;
  }
}

export default ClaimConditionFactory;
