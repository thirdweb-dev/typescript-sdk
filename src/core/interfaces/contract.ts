import { Signer } from "ethers";

/**
 * @public
 */
export interface UpdateableNetwork {
  onSignerUpdated(signer: Signer | undefined): void;
  getAddress(): string;
  getChainId(): number;
}
