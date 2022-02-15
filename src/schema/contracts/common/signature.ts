import { BigNumberSchema, DateSchema, PriceSchema } from "../../shared";
import { z } from "zod";
import { CommonNFTInput } from "../../tokens/common";
import { NATIVE_TOKEN_ADDRESS } from "../../../constants/currency";
import { AddressZero } from "@ethersproject/constants";

export const SignaturePayloadInput = z.object({
  metadata: CommonNFTInput,
  to: z.string(),
  price: PriceSchema,
  currencyAddress: z.string().default(NATIVE_TOKEN_ADDRESS),
  mintStartTimeEpochSeconds: DateSchema,
  mintEndTimeEpochSeconds: DateSchema,
  uid: z.string().optional(),
  royaltyRecipient: z.string().default(AddressZero),
  primarySaleRecipient: z.string().default(AddressZero),
});

export const SignaturePayloadOutput = SignaturePayloadInput.extend({
  uri: z.string(),
  price: BigNumberSchema,
  mintStartTimeEpochSeconds: BigNumberSchema,
  mintEndTimeEpochSeconds: BigNumberSchema,
});

/**
 * @internal
 */
export type FilledSignaturePayload = z.output<typeof SignaturePayloadInput>;
/**
 * @internal
 */
export type PayloadWithUri = z.output<typeof SignaturePayloadOutput>;

export type PayloadToSign = z.input<typeof SignaturePayloadInput>;
export type SignedPayload = { payload: PayloadWithUri; signature: string };

export const MintRequest = [
  { name: "to", type: "address" },
  { name: "uri", type: "string" },
  { name: "price", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];
