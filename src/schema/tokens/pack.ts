import { z } from "zod";
import { RawDateSchema } from "../shared";
import { NFTInputOrUriSchema } from "./common";
import {
  ERC1155WrappableSchema,
  ERC20WrappableSchema,
  ERC721WrappableSchema,
} from "./common/wrap";

/**
 * @internal
 */
const ERC20RewardContentsSchema = ERC20WrappableSchema.extend({
  totalRewards: z.number().default(1),
});

/**
 * @internal
 */
const ERC721RewardContentsSchema = ERC721WrappableSchema;

/**
 * @internal
 */
const ERC1155RewardContentsSchema = ERC1155WrappableSchema.extend({
  totalRewards: z.number().default(1),
});

/**
 * @internal
 */
export const PackRewardsSchema = z.object({
  erc20Rewards: z.array(ERC20WrappableSchema).default([]),
  erc721Rewards: z.array(ERC721WrappableSchema).default([]),
  erc1155Rewards: z.array(ERC1155WrappableSchema).default([]),
});

/**
 * @internal
 */
export const PackMetadataInputSchema = z.object({
  metadata: NFTInputOrUriSchema,
  erc20Rewards: z.array(ERC20RewardContentsSchema).default([]),
  erc721Rewards: z.array(ERC721RewardContentsSchema).default([]),
  erc1155Rewards: z.array(ERC1155RewardContentsSchema).default([]),
  rewardsPerPack: z.number().default(1),
  openStartTime: RawDateSchema.default(new Date()),
});

/**
 * @public
 */
export type PackMetadataInput = z.input<typeof PackMetadataInputSchema>;

/**
 * @public
 */
export type PackMetadataOutput = z.output<typeof PackMetadataInputSchema>;

/**
 * @public
 */
export type PackRewards = z.input<typeof PackRewardsSchema>;
