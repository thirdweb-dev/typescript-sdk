import { IStorage } from "../core/interfaces/IStorage";
import {
  PublicClaimCondition,
  SnapshotInfo,
} from "../types/claim-conditions/PublicClaimCondition";
import { isAddress } from "@ethersproject/address";
import { BytesLike, hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { InvalidAddressError } from "../common/error";
import invariant from "tiny-invariant";
import { createSnapshot } from "../common/snapshots";

export default class ClaimConditionPhase {
  // In seconds
  private _conditionStartTime = Math.floor(Date.now() / 1000);
  private _currencyAddress = "";
  private _price: BigNumberish = 0;
  private _maxQuantity: BigNumberish = ethers.constants.MaxUint256;
  private _quantityLimitPerTransaction: BigNumberish =
    ethers.constants.MaxUint256;
  private _merkleRootHash: BytesLike = hexZeroPad([0], 32);
  private _snaphsotInfo?: SnapshotInfo = undefined;
  private _snapshot?: string[] = undefined;
  private _waitInSeconds: BigNumberish = 0;

  /**
   * Set the price claim condition for the drosp.
   *
   * @param price - The price of the currency in wei. Must be >= 0.
   * @param tokenAddress - The address of an ERC20 contract to use as the currency for the claim. By default this is the native currency address which is 0x0000000000000000000000000000000000000000 address.
   */
  public setPrice(
    price: BigNumberish,
    tokenAddress: string = AddressZero,
  ): ClaimConditionPhase {
    if (!isAddress(tokenAddress)) {
      throw new InvalidAddressError(tokenAddress);
    }
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
      // if its starting in the past, just set it to now
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

  /**
   * The max quantity of NFTs that can be claimed in a single transaction.
   *
   * @param max - The max quantity NFTs that can be claimed in a single transaction.
   */
  public setMaxQuantityPerTransaction(max: BigNumberish): ClaimConditionPhase {
    const maxQuantity = BigNumber.from(max);
    invariant(maxQuantity.gte(1), "Max quantity per transaction must be > 0");
    this._quantityLimitPerTransaction = maxQuantity;
    return this;
  }

  /**
   * Sets a merkle root hash for the claim condition.
   *
   * @param root - The merkle root hash
   */
  public setMerkleRoot(root: string): ClaimConditionPhase {
    this._merkleRootHash = root;
    return this;
  }

  /**
   * Sets a snapshot of user wallets to restrict minting to
   *
   * @param addresses - the wallet addresses
   */
  public setSnapshot(addresses: string[]): ClaimConditionPhase {
    this._snapshot = addresses;
    return this;
  }

  /**
   * Wait time enforced after calling `claim` before the next `claim` can be called.
   *
   * @param waitInSeconds - The wait time in seconds.
   */
  public setWaitTimeBetweenClaims(
    waitInSeconds: BigNumberish,
  ): ClaimConditionPhase {
    this._waitInSeconds = waitInSeconds;
    return this;
  }

  /**
   * @internal
   */
  public setSnaphsotInfo(value: SnapshotInfo) {
    this._snaphsotInfo = value;
  }

  get snaphsotInfo(): SnapshotInfo | undefined {
    return this._snaphsotInfo;
  }

  get snapshot(): string[] | undefined {
    return this._snapshot;
  }

  get conditionStartTime(): number {
    return this._conditionStartTime;
  }

  get currencyAddress(): string {
    return this._currencyAddress;
  }

  get price(): BigNumberish {
    return this._price;
  }

  get maxQuantity(): BigNumberish {
    return this._maxQuantity;
  }

  get quantityLimitPerTransaction(): BigNumberish {
    return this._quantityLimitPerTransaction;
  }

  get merkleRootHash(): BytesLike {
    return this._merkleRootHash;
  }

  get waitInSeconds(): BigNumberish {
    return this._waitInSeconds;
  }
}
