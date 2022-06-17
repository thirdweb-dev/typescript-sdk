import { NetworkOrSignerOrProvider } from "../types";
import { ChainOrRpc } from "../../constants/index";

/**
 * @public
 */
export interface UpdateableNetwork {
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void;
  getAddress(): string;
  getChainOrRpc(): ChainOrRpc;
}
