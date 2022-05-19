import { ethers, Signer, providers } from "ethers";
import { EventEmitter2 } from "eventemitter2";
import {
  SDKOptions,
  SDKOptionsOutput,
  SDKOptionsSchema,
} from "../../schema/sdk-options";
import { NetworkOrSignerOrProvider, SignerOrProvider } from "../types";
import { ChainOrRpc } from "../../constants";
import { Provider } from "@ethersproject/providers";

/**
 * @internal
 */
export class RPCConnectionHandler extends EventEmitter2 {
  private provider: providers.Provider;
  private signer: Signer | undefined;

  constructor(provider: Provider, signer?: Signer) {
    super();
    this.signer = signer;
    this.provider = provider;
  }
  /**
   * The function to call whenever the network changes, such as when the users connects their wallet, disconnects their wallet, the connected chain changes, etc.
   *
   * @param network - a network, signer or provider that ethers js can interpret
   */
  public updateProvider(provider: Provider) {
    this.provider = provider;
  }

  public updateSigner(signer: Signer | undefined) {
    this.signer = signer;
  }
  /**
   *
   * @returns whether or not a signer is set, `true` if there is no signer so the class is in "read only" mode
   */
  public isReadOnly(): boolean {
    return !Signer.isSigner(this.signer);
  }

  /**
   * Explicitly get the active signer.
   * @returns the active signer, if there is one
   */
  public getSigner(): Signer | undefined {
    return this.signer;
  }

  /**
   * Explicitly get the active signer.
   * @returns the active provider
   */
  public getProvider(): providers.Provider {
    return this.provider;
  }

  /**
   *
   * @returns the current signer if there is one, otherwise the active provider
   */
  public getSignerOrProvider(): Signer | providers.Provider {
    return this.getSigner() || this.getProvider();
  }
}
