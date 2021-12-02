import { isAddress } from "@ethersproject/address";
import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish, BytesLike, ethers } from "ethers";
import { InvalidAddressError } from "../common/error";
import { invariant } from "../common/invariant";
import { PublicMintCondition } from "../types/claim-conditions/PublicMintCondition";

export default class ClaimConditionPhase {
  // TODO: Should this be in seconds? Or milliseconds? [seconds, please update]
  private _conditionStartTime = Date.now();

  private _currencyAddress = "";

  private _price: BigNumberish = 0;

  private _maxQuantity: BigNumberish = BigNumber.from(0);

  private _quantityLimitPerTransaction: BigNumberish =
    ethers.constants.MaxUint256;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  public verify() {
    if (this._currencyAddress === "" || !isAddress(this._currencyAddress)) {
      throw new Error("Currency address not set");
    }
  }

  /**
   * Set the price claim condition for the drop.
   *
   * @param price - The price of the currency in wei. Must be >= 0.
   * @param tokenAddress - The address of an ERC20 contract to use as the currency for the claim. By default this is the native currency address which is 0x0000000000000000000000000000000000000000 address.
   */
  public setPrice(
    price: BigNumberish,
    tokenAddress: string = AddressZero,
  ): ClaimConditionPhase {
    invariant(price >= 0, "Price cannot be negative");

    this._price = price;
    this._currencyAddress = tokenAddress;
    return this;
  }

  /**
   * Set the start time for the claim condition.
   *
   * @param startTime - The start time for the claim condition. Can be a Date object or a number of seconds since the epoch.
   */
  public setConditionStartTime(when: Date | number): ClaimConditionPhase {
    if (typeof when === "number") {
      this._conditionStartTime = Math.floor(when);
    } else {
      this._conditionStartTime = Math.floor(when.getTime() / 1000);
    }
    return this;
  }

  /**
   * Override the maxQuantity for the claim condition after creating the phase.
   *
   * @param maxQuantity - The max quantity NFTs that can be claimed in this phase.
   */
  public setMaxQuantity(maxQuantity: BigNumberish): ClaimConditionPhase {
    this._maxQuantity = maxQuantity;
    return this;
  }

  public setMaxQuantityPerTransaction(max: BigNumberish): ClaimConditionPhase {
    const maxQuantity = BigNumber.from(max);
    invariant(maxQuantity.gte(1), "Max quantity per transaction must be > 0");
    this._quantityLimitPerTransaction = maxQuantity;
    return this;
  }

  /**
   * Helper method that provides defaults for each claim condition.
   * @internal
   */
  public buildPublicClaimCondition(): PublicMintCondition {
    return {
      startTimestamp: BigNumber.from(this._conditionStartTime),
      pricePerToken: this._price,
      currency: this._currencyAddress,
      maxMintSupply: this._maxQuantity,

      waitTimeSecondsLimitPerTransaction: 0,

      // TODO: I don't understand this default value
      quantityLimitPerTransaction: this._quantityLimitPerTransaction,
      currentMintSupply: 0,
      merkleRoot: hexZeroPad([0], 32),
    };
  }
}
