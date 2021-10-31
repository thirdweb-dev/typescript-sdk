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

export async function getAndIncrementNonce(
  forwarder: Forwarder,
  address: string,
): Promise<BigNumber> {
  if (!(address in _nonces)) {
    _nonces[address] = await forwarder.getNonce(address);
  }

  const nonce = _nonces[address];
  _nonces[address] = BigNumber.from(_nonces[address]).add(1);
  return nonce;
}
