import { ChainId } from "../constants/chains";

if (!globalThis.fetch) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.fetch = require("node-fetch");
}

/**
 * @internal
 */
function getGasStationUrl(chainId?: number): string | null {
  if (!chainId) {
    return null;
  }

  if (chainId === ChainId.Polygon) {
    return "https://gasstation-mainnet.matic.network";
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
  speed: string,
  maxGasPrice: number,
): Promise<number | null> {
  const gasStationUrl = getGasStationUrl(chainId);
  if (!gasStationUrl) {
    return null;
  }
  try {
    const data = await (await fetch(gasStationUrl)).json();
    const gas = data[speed];
    if (gas > 0) {
      return Math.min(gas, maxGasPrice);
    }
  } catch (e) {
    console.error("failed to fetch gas", e);
  }
  return null;
}
