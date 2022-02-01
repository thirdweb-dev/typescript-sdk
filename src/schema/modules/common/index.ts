/* eslint-disable line-comment-position */
import { BasisPointsSchema, JsonSchema } from "../../shared";
import { AddressZero } from "@ethersproject/constants";
import { z } from "zod";
import { FORWARDER_ADDRESS } from "../../../constants/addresses";

export interface ModuleSchema {}

export const CommonModuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(), // TODO - FileBufferOrStringSchema, requires recursive upload in IStorage
  external_link: z.string().url().optional(),
});

export const CommonModuleOutputSchema = CommonModuleSchema.extend({
  image: z.string().optional(),
}).catchall(z.lazy(() => JsonSchema));

export const CommonRoyaltySchema = z.object({
  /**
   * The amount of royalty collected on all royalties represented as basis points.
   * The default is 0 (no royalties).
   *
   * 1 basis point = 0.01%
   *
   * For example: if this value is 100, then the royalty is 1% of the total sales.
   *
   *  @internalremarks used by OpenSea "seller_fee_basis_points"
   */
  seller_fee_basis_points: BasisPointsSchema.default(0),

  /**
   * The address of the royalty recipient. All royalties will be sent
   * to this address.
   * @internalremarks used by OpenSea "fee_recipient"
   */
  fee_recipient: z.string().default(AddressZero),
});

export const CommonPlatformFeeSchema = z.object({
  /**
   * platform fee basis points
   */
  platform_fee_basis_points: BasisPointsSchema.default(0),
  /**
   * platform fee recipient address
   */
  platform_fee_recipient: z.string().default(AddressZero),
});

export const CommonTrustedForwarderSchema = z.object({
  trusted_forwarder: z.string().default(FORWARDER_ADDRESS),
});
