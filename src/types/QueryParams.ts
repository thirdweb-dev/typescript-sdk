import { BigNumberish, ethers } from "ethers";

/**
 * @internal
 */
export const DEFAULT_QUERY_ALL_COUNT = ethers.constants.MaxUint256;

/**
 * @public
 */
export interface QueryAllParams {
  start: BigNumberish;
  count: BigNumberish;
}
