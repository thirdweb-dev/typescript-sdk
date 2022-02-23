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
export const SnapshotInputSchema = z.object({
  addresses: z.array(z.string()),
  maxClaimablePerAddress: z.optional(z.array(z.number())),
});

/**
 * @internal
 */
export const SnapshotSchema = z.object({
  /**
   * The merkle root
   */
  merkleRoot: z.string(),
  claims: z.array(
    z.object({
      address: z.string(),
      maxClaimable: z.number(),
      proof: z.array(z.string()),
    }),
  ),
});

/**
 * @internal
 */
export const SnapshotJSONInputSchema = z.preprocess((arg) => {
  if (typeof arg === "string") {
    return JSON.parse(arg);
  } else {
    return arg;
  }
}, SnapshotSchema);

/**
 * @internal
 */
export const SnapshotInfoSchema = z.object({
  merkleRoot: z.string(),
  snapshotUri: z.string(),
  snapshot: SnapshotSchema,
});
