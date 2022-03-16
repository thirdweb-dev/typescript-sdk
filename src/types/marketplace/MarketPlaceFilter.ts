import { QueryAllParams } from "../QueryParams";

export interface MarketplaceFilter extends QueryAllParams {
  seller?: string;
  tokenContract?: string;
  tokenId?: number;
}
