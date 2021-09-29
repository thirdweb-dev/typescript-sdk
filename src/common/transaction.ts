import { CallOverrides, ethers } from "ethers";
import { getGasPriceForChain } from "./gas-price";

/**
 * @internal
 */
export async function getTransactionCallOverrides(
  chainId: number,
  speed: string,
  maxGasPrice: number,
): Promise<CallOverrides> {
  const gasPriceChain = await getGasPriceForChain(chainId, speed, maxGasPrice);
  if (!gasPriceChain) {
    return {};
  }
  // TODO: support EIP-1559 by try-catch, provider.getFeeData();
  return {
    gasPrice: ethers.utils.parseUnits(gasPriceChain.toString(), "gwei"),
  };
}
