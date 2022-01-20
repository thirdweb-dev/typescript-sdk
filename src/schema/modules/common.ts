import { AddressZero } from "@ethersproject/constants";
import { z } from "zod";
import { FORWARDER_ADDRESS } from "../../constants/addresses";

if (!global.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.File = require("@web-std/file").File;
}

export const FileBufferOrStringSchema = z.union([
  z.instanceof(File),
  z.instanceof(Buffer),
  z.string(),
]);

export const BasisPointsSchema = z
  .number()
  .min(0, "basis points cannot be less than 0")
  .max(10000, "basis points cannot be greater than 10000");

export const CommonModuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: FileBufferOrStringSchema.optional(),
  external_link: z.string().url().optional(),
});

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
  seller_fee_basis_points: BasisPointsSchema.default(0).optional(),

  /**
   * The address of the royalty recipient. All royalties will be sent
   * to this address.
   * @internalremarks used by OpenSea "fee_recipient"
   */
  fee_recipient: z.string().default(AddressZero).optional(),
});

export const CommonPlatformFeeSchema = z.object({
  /**
   * platform fee basis points
   */
  platform_fee_basis_points: BasisPointsSchema.default(0).optional(),
  /**
   * platform fee recipient address
   */
  platform_fee_recipient: z.string().default(AddressZero).optional(),
});

export const CommonTrustedForwarderSchema = z.object({
  trusted_forwarder: z.string().default(FORWARDER_ADDRESS).optional(),
});
