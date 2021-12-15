import { Forwarder } from "@3rdweb/contracts";
import { BigNumber } from "ethers";

/**
 * @internal
 */
export const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

const _nonces: Record<string, BigNumber> = {};
const _noncesSyncTimestamp: Record<string, number> = {};

export async function getAndIncrementNonce(
  forwarder: Forwarder,
  address: string,
): Promise<BigNumber> {
  const timestamp = _noncesSyncTimestamp[address];
  // if it's within 2 seconds we're optimistically increment the nonce
  // should we always sync?
  const shouldSync = Date.now() - timestamp >= 2000;

  if (!(address in _nonces) || shouldSync) {
    _nonces[address] = await forwarder.getNonce(address);
    _noncesSyncTimestamp[address] = Date.now();
  }

  const nonce = _nonces[address];
  _nonces[address] = BigNumber.from(_nonces[address]).add(1);
  return nonce;
}
