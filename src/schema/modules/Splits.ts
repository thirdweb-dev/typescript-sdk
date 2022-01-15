import { JsonObject } from "json2typescript";
import { CommonModuleMetadata, CommonTrustedForwarderMetadata } from "./common";
import type { BigNumberish } from "ethers";
import { Mixin } from "ts-mixer";

/**
 * The NewSplitRecipient interface describes the structure of a new split recipient.
 * The `shares` property is important for the calculation of the the total split.
 *
 * If there are two recipients each with 10 shares, they each will receive 50%
 * of the total royalties.
 *
 * If there are two recipients each with 1 share, they each will receive 50%
 * of the total royalties.
 *
 * I.e. the total number of shares is used to calculate the percentage of the
 * total royalties that is allocated to each recipient.
 */
export interface NewSplitRecipient {
  /**
   * The address of the recipient
   */
  address: string;

  /**
   * The number of shares for the recipient
   */
  shares: BigNumberish;
}

@JsonObject("SplitsModuleMetadata")
export class SplitsModuleMetadata extends CommonModuleMetadata {}

@JsonObject("DeploySplitsModuleMetadata")
export class DeploySplitsModuleMetadata extends Mixin(
  SplitsModuleMetadata,
  CommonTrustedForwarderMetadata,
) {
  recipientSplits: NewSplitRecipient[] = [];
}

export default SplitsModuleMetadata;
