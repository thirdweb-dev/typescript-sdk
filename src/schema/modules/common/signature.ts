import { BigNumberishSchema } from "../../shared";
import { z } from "zod";
import { CommonNFTInput } from "../../tokens/common";
import { randomUUID } from "crypto";

export const SignaturePayloadInput = z.object({
  metadata: CommonNFTInput,
  to: z.string(),
  price: BigNumberishSchema,
  currencyAddress: z.string(),
  mintStartTimeEpochSeconds: BigNumberishSchema,
  mintEndTimeEpochSeconds: BigNumberishSchema,
  id: z.string().default(randomUUID()),
});

export const SignaturePayloadOutput = SignaturePayloadInput.extend({
  uri: z.string(),
});

export type NewSignaturePayload = z.input<typeof SignaturePayloadInput>;
export type SignaturePayload = z.input<typeof SignaturePayloadOutput>;
