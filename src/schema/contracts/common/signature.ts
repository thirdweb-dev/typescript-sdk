import {
  BasisPointsSchema,
  BigNumberishSchema,
  BigNumberSchema,
  DateSchema,
  PriceSchema,
} from "../../shared";
import { z } from "zod";
import { CommonNFTInput } from "../../tokens/common";
import { NATIVE_TOKEN_ADDRESS } from "../../../constants/currency";
import { AddressZero } from "@ethersproject/constants";
import { ethers } from "ethers";
import { resolveOrGenerateId } from "../../../common/signature-minting";

/**
 * @internal
 */
export const SignaturePayloadInput = z.object({
  metadata: CommonNFTInput,
  to: z.string().default(AddressZero),
  price: PriceSchema.default(0),
  currencyAddress: z.string().default(NATIVE_TOKEN_ADDRESS),
  mintStartTime: DateSchema,
  mintEndTime: DateSchema,
  uid: z
    .string()
    .optional()
    .transform((arg) => resolveOrGenerateId(arg)),
  royaltyRecipient: z.string().default(AddressZero),
  royaltyBps: BasisPointsSchema.default(0),
  primarySaleRecipient: z.string().default(AddressZero),
});

/**
 * @internal
 */
export const SignaturePayloadOutput = SignaturePayloadInput.extend({
  uri: z.string(),
  royaltyBps: BigNumberSchema,
  price: BigNumberSchema,
  mintStartTime: BigNumberSchema,
  mintEndTime: BigNumberSchema,
});

/**
 * @internal
 */
export const Signature1155PayloadInput = SignaturePayloadInput.extend({
  tokenId: BigNumberishSchema.default(ethers.constants.MaxUint256),
  quantity: BigNumberishSchema,
});

/**
 * @internal
 */
export const Signature1155PayloadOutput = SignaturePayloadOutput.extend({
  tokenId: BigNumberSchema,
  quantity: BigNumberSchema,
});

/**
 * @public
 */
export type FilledSignaturePayload = z.output<typeof SignaturePayloadInput>;
/**
 * @public
 */
export type PayloadWithUri = z.output<typeof SignaturePayloadOutput>;

export type PayloadToSign = z.input<typeof SignaturePayloadInput>;
export type SignedPayload = { payload: PayloadWithUri; signature: string };

/**
 * @public
 */
export type FilledSignaturePayload1155 = z.output<
  typeof Signature1155PayloadInput
>;
/**
 * @public
 */
export type PayloadWithUri1155 = z.output<typeof Signature1155PayloadOutput>;
/**
 * @public
 */
export type PayloadToSign1155 = z.input<typeof Signature1155PayloadInput>;
/**
 * @public
 */
export type SignedPayload1155 = {
  payload: PayloadWithUri1155;
  signature: string;
};

export const MintRequest721 = [
  { name: "to", type: "address" },
  { name: "royaltyRecipient", type: "address" },
  { name: "royaltyBps", type: "uint256" },
  { name: "primarySaleRecipient", type: "address" },
  { name: "uri", type: "string" },
  { name: "price", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];

export const MintRequest1155 = [
  { name: "to", type: "address" },
  { name: "royaltyRecipient", type: "address" },
  { name: "royaltyBps", type: "uint256" },
  { name: "primarySaleRecipient", type: "address" },
  { name: "tokenId", type: "uint256" },
  { name: "uri", type: "string" },
  { name: "quantity", type: "uint256" },
  { name: "pricePerToken", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];
