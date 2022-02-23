import { BigNumberish } from "ethers";

/**
 * @internal
 */
export const DEFAULT_QUERY_ALL_COUNT = 100;

/**
 * @public
 */
export interface QueryAllParams {
  start: BigNumberish;
  count: BigNumberish;
}
