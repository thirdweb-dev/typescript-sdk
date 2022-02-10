import { BigNumberishSchema } from "../../shared";
import { z } from "zod";
import { CommonNFTInput } from "../../tokens/common";
import { v4 as uuidv4 } from "uuid";

export const SignaturePayloadInput = z.object({
  metadata: CommonNFTInput,
  to: z.string(),
  price: BigNumberishSchema,
  currencyAddress: z.string(),
  mintStartTimeEpochSeconds: BigNumberishSchema,
  mintEndTimeEpochSeconds: BigNumberishSchema,
  id: z.string().default(uuidv4()),
});

export const SignaturePayloadOutput = SignaturePayloadInput.extend({
  uri: z.string(),
});

export type NewSignaturePayload = z.input<typeof SignaturePayloadInput>;
export type SignaturePayload = z.input<typeof SignaturePayloadOutput>;

export const MintRequest = [
  { name: "to", type: "address" },
  { name: "uri", type: "string" },
  { name: "price", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];
