import { z } from "zod";
import { ethers } from "ethers";
import { BigNumberishSchema, BytesLikeSchema } from "../../shared";
import { hexZeroPad } from "ethers/lib/utils";
import { AddressZero } from "@ethersproject/constants";

export const ClaimConditionInputSchema = z.object({
  startTime: z
    .union([z.date(), z.number()])
    .transform((i) => {
      if (typeof i === "number") {
        return Math.floor(i);
      } else {
        return Math.floor(i.getTime() / 1000);
      }
    })
    .default(Math.floor(Date.now() / 1000)),
  currencyAddress: z.string().default(AddressZero),
  price: BigNumberishSchema.default(0),
  maxQuantity: BigNumberishSchema.default(ethers.constants.MaxUint256),
  quantityLimitPerTransaction: BigNumberishSchema.default(
    ethers.constants.MaxUint256,
  ),
  waitInSeconds: BigNumberishSchema.default(0),
  merkleRootHash: BytesLikeSchema.default(hexZeroPad([0], 32)),
  snapshot: z.optional(z.array(z.string())),
});

export const PartialClaimConditionInputSchema =
  ClaimConditionInputSchema.partial();
