import { ChainId } from "./chain";

/**
 *
 * @internal
 */
function getGasStationUrl(chainId?: number): string | null {
  if (!chainId) {
    return null;
  }

  if (chainId === ChainId.Polygon) {
    return "https://gasstation-mainnet.matic.network";
  } else if (chainId === ChainId.Mumbai) {
    return "https://gasstation-mumbai.matic.today";
  }

  return null;
}

/**
 *
 * @returns the gas price
 * @internal
 */
export async function getGasPriceForChain(
  chainId: number,
  speed = "fastest",
  maxGasPrice = 100,
): Promise<number> {
  const gasStationUrl = getGasStationUrl(chainId);
  if (!gasStationUrl) {
    return maxGasPrice;
  }
  const data = await (await fetch(gasStationUrl)).json();
  const gas = data[speed];
  return Math.min(gas, maxGasPrice);
}
