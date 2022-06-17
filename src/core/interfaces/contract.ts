import { NetworkOrSignerOrProvider } from "../types";
import { ChainOrRpc } from "../../types/chains";

/**
 * @public
 */
export interface UpdateableNetwork {
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void;
  getAddress(): string;
  getChainOrRpc(): ChainOrRpc;
}
