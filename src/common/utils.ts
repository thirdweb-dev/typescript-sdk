import { ethers } from "ethers";

/**
 * @internal
 */
export const isBrowser = () => typeof window !== "undefined";

/**
 * @internal
 */
export const isNode = () => !isBrowser();

/**
 * @internal
 */
export const resolveAddress = async (address: string): Promise<boolean> => {
  const isAddress = ethers.utils.getAddress(address);

  if (isAddress) {
    return true;
  }

  const regex =
    /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?/;

  if (regex.test(address)) {
    const provider = new ethers.providers.EtherscanProvider(
      process.env.ETHERSCAN_API_KEY,
    );
    const isResolved = await provider.resolveName(address);
    if (isResolved) {
      return true;
    }
  }

  return false;
};
