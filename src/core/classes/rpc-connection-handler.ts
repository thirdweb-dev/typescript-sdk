import { providers, Signer } from "ethers";
import { getProviderForChain } from "../../constants/urls";
import { ConnectionInfo } from "../types";
import { ChainOrRpc } from "../../constants";
import { EventEmitter2 } from "eventemitter2";

/**
 * @internal
 */
export class RPCConnectionHandler extends EventEmitter2 {
  private chainId: ChainOrRpc;
  private provider: providers.Provider;
  private signer: Signer | undefined;

  // TODO (rpc) needs the options to be passed in to override RPC urls
  constructor(connection: ConnectionInfo) {
    super();
    this.chainId = connection.chainId;
    this.provider = connection.provider
      ? connection.provider
      : getProviderForChain(connection.chainId);
    this.signer = connection.signer;
  }

  // TODO (rpc) see if we need to expose this
  // public updateProvider(provider: Provider) {
  //   this.provider = provider;
  // }

  /**
   * The function to call whenever the network changes, such as when the users connects their wallet, disconnects their wallet, the connected chain changes, etc.
   *
   * @param signer
   */
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

  public getConnectionInfo(): ConnectionInfo {
    return {
      chainId: this.chainId,
      signer: this.getSigner(),
      provider: this.getProvider(),
    };
  }
  //
  // /** ********************
  //  * PRIVATE FUNCTIONS
  //  *********************/
  //
  // private getSignerAndProvider(
  //   network: NetworkOrSignerOrProvider,
  //   options: SDKOptions,
  // ): [Signer | undefined, providers.Provider] {
  //   let signer: Signer | undefined;
  //   let provider: providers.Provider | undefined;
  //
  //   if (Signer.isSigner(network)) {
  //     signer = network;
  //     if (network.provider) {
  //       provider = network.provider;
  //     }
  //   }
  //
  //   if (options?.readonlySettings) {
  //     provider = getReadOnlyProvider(
  //       options.readonlySettings.rpcUrl,
  //       options.readonlySettings.chainId,
  //     );
  //   }
  //
  //   if (!provider) {
  //     if (providers.Provider.isProvider(network)) {
  //       provider = network;
  //     } else if (!Signer.isSigner(network)) {
  //       if (typeof network === "string") {
  //         provider = getReadOnlyProvider(
  //           network,
  //           options?.readonlySettings?.chainId,
  //         );
  //       } else {
  //         // no a signer, not a provider, not a string? try with default provider
  //         provider = ethers.getDefaultProvider(network);
  //       }
  //     }
  //   }
  //
  //   if (!provider) {
  //     // we should really never hit this case!
  //     provider = ethers.getDefaultProvider();
  //     console.error(
  //       "No provider found, using default provider on default chain!",
  //     );
  //   }
  //
  //   return [signer, provider];
  // }
}
