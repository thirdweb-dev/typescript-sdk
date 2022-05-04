import { IPlatformFee } from "contracts";
import { ContractWrapper } from "./contract-wrapper";
import { TransactionResult } from "../types";
import { CommonPlatformFeeSchema } from "../../schema";
import { z } from "zod";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { FEATURE_PLATFORM_FEE } from "../../constants/thirdweb-features";

/**
 * Handles primary sales recipients for a Contract
 * @public
 */
export class ContractPlatformFee<TContract extends IPlatformFee>
  implements DetectableFeature
{
  featureName = FEATURE_PLATFORM_FEE.name;
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * Get the platform fee recipient and basis points
   * @returns the wallet address.
   */
  public async get() {
    const [platformFeeRecipient, platformFeeBps] =
      await this.contractWrapper.readContract.getPlatformFeeInfo();
    return CommonPlatformFeeSchema.parse({
      platform_fee_recipient: platformFeeRecipient,
      platform_fee_basis_points: platformFeeBps,
    });
  }

  /**
   * Set the platform fee recipient and basis points
   * @param platformFeeInfo - the platform fee information
   */
  public async set(
    platformFeeInfo: z.input<typeof CommonPlatformFeeSchema>,
  ): Promise<TransactionResult> {
    const parsed = CommonPlatformFeeSchema.parse(platformFeeInfo);
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "setPlatformFeeInfo",
        [parsed.platform_fee_recipient, parsed.platform_fee_basis_points],
      ),
    };
  }
}
