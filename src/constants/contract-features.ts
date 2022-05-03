import {
  FEATURE_NFT,
  FEATURE_NFT_BATCH_MINTABLE,
  FEATURE_NFT_ENUMERABLE,
  FEATURE_NFT_MINTABLE,
  FEATURE_NFT_SUPPLY,
} from "./erc721-features";
import {
  FEATURE_TOKEN,
  FEATURE_TOKEN_BATCH_MINTABLE,
  FEATURE_TOKEN_MINTABLE,
} from "./erc20-features";
import {
  FEATURE_EDITION,
  FEATURE_EDITION_BATCH_MINTABLE,
  FEATURE_EDITION_ENUMERABLE,
  FEATURE_EDITION_MINTABLE,
} from "./erc1155-features";
import {
  FEATURE_PLATFORM_FEE,
  FEATURE_PRIMARY_SALE,
  FEATURE_ROYALTY,
} from "./thirdweb-features";

/**
 * @internal
 */
export type Feature =
  | typeof FEATURE_TOKEN
  | typeof FEATURE_TOKEN_MINTABLE
  | typeof FEATURE_TOKEN_BATCH_MINTABLE
  | typeof FEATURE_NFT
  | typeof FEATURE_NFT_SUPPLY
  | typeof FEATURE_NFT_ENUMERABLE
  | typeof FEATURE_NFT_MINTABLE
  | typeof FEATURE_NFT_BATCH_MINTABLE
  | typeof FEATURE_EDITION
  | typeof FEATURE_EDITION_ENUMERABLE
  | typeof FEATURE_EDITION_MINTABLE
  | typeof FEATURE_EDITION_BATCH_MINTABLE
  | typeof FEATURE_ROYALTY
  | typeof FEATURE_PLATFORM_FEE
  | typeof FEATURE_PRIMARY_SALE;

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
  [FEATURE_ROYALTY.name]: FEATURE_ROYALTY,
  [FEATURE_PLATFORM_FEE.name]: FEATURE_PLATFORM_FEE,
  [FEATURE_PRIMARY_SALE.name]: FEATURE_PRIMARY_SALE,
};
