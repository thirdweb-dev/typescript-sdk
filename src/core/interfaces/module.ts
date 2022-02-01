import { NetworkOrSignerOrProvider } from "../types";

export interface UpdateableNetwork {
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void;
}
