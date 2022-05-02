/**
 * @internal
 */
import {
  FEATURE_NFT,
  FEATURE_NFT_BATCH_MINTABLE,
  FEATURE_NFT_ENUMERABLE,
  FEATURE_NFT_MINTABLE,
  FEATURE_NFT_SUPPLY,
} from "./erc721-features";
import { FEATURE_TOKEN } from "./erc20-features";
import {
  FEATURE_EDITION,
  FEATURE_EDITION_ENUMERABLE,
} from "./erc1155-features";

export type Feature =
  | typeof FEATURE_TOKEN
  | typeof FEATURE_NFT
  | typeof FEATURE_NFT_SUPPLY
  | typeof FEATURE_NFT_ENUMERABLE
  | typeof FEATURE_NFT_MINTABLE
  | typeof FEATURE_NFT_BATCH_MINTABLE
  | typeof FEATURE_EDITION
  | typeof FEATURE_EDITION_ENUMERABLE;

/**
 * @internal
 */
export type FeatureName = Feature["name"];
/**
 * @internal
 */
export type FeatureWithEnabled = Feature & {
  features: Record<string, FeatureWithEnabled>;
  enabled: boolean;
};

/**
 * @internal
 */
export const SUPPORTED_FEATURES: Record<string, Feature> = {
  [FEATURE_TOKEN.name]: FEATURE_TOKEN,
  [FEATURE_NFT.name]: FEATURE_NFT,
  [FEATURE_EDITION.name]: FEATURE_EDITION,
};
