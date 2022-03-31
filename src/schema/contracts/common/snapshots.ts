import { z } from "zod";

/**
 * @internal
 */
export const MerkleSchema = z.object({
  merkle: z.record(z.string()).default({}),
});

/**
 * @internal
 */
export const SnapshotAddress = z.object({
  address: z.string(),
  maxClaimable: z.number().default(0),
});

/**
 * @internal
 */
export const SnapshotInputSchema = z.union([
  z.array(z.string()).transform((strings) =>
    strings.map((address) =>
      SnapshotAddress.parse({
        address,
      }),
    ),
  ),
  z.array(SnapshotAddress),
]);

/**
 * @internal
 */
export const SnapshotSchema = z.object({
  /**
   * The merkle root
   */
  merkleRoot: z.string(),
  claims: z.array(
    SnapshotAddress.extend({
      proof: z.array(z.string()),
    }),
  ),
});

/**
 * @internal
 */
export const SnapshotInfoSchema = z.object({
  merkleRoot: z.string(),
  snapshotUri: z.string(),
  snapshot: SnapshotSchema,
});
