import { NetworkOrSignerOrProvider } from "../types";

export interface UpdateableNetwork {
  updateSignerOrProvider(network: NetworkOrSignerOrProvider): void;
}
