import { QueryAllParams } from "../QueryParams";

/**
 * @public
 */
export interface MarketplaceFilter extends QueryAllParams {
  seller?: string;
  tokenContract?: string;
  tokenId?: number;
}
