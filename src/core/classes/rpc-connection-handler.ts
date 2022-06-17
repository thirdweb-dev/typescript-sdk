import { providers, Signer } from "ethers";
import { ConnectionInfo } from "../types";
import { ChainOrRpc, getProviderForChain } from "../../constants";
import { EventEmitter2 } from "eventemitter2";
import {
  SDKOptions,
  SDKOptionsOutput,
  SDKOptionsSchema,
} from "../../schema/index";

/**
 * @internal
 */
export class RPCConnectionHandler extends EventEmitter2 {
  protected options: SDKOptionsOutput;
  private chainId: ChainOrRpc; // TODO (rpc) enforce this to be a pure ChainId
  private provider: providers.Provider;
  private signer: Signer | undefined;

  // TODO (rpc) needs the options to be passed in to override RPC urls
  constructor(connection: ConnectionInfo, options: SDKOptions = {}) {
    super();
    try {
      this.options = SDKOptionsSchema.parse(options);
    } catch (optionParseError) {
      console.error(
        "invalid contract options object passed, falling back to default options",
        optionParseError,
      );
      this.options = SDKOptionsSchema.parse({});
    }
    this.chainId = connection.chainId;
    this.provider = connection.provider
      ? connection.provider
      : getProviderForChain(
          connection.chainId,
          this.options.chainIdToRPCUrlMap,
        );
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
   * @internal
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
   * @internal
   */
  public getSigner(): Signer | undefined {
    return this.signer;
  }

  /**
   * Explicitly get the active signer.
   * @returns the active provider
   * @internal
   */
  public getProvider(): providers.Provider {
    return this.provider;
  }

  /**
   * @returns the current signer if there is one, otherwise the active provider
   * @internal
   */
  public getSignerOrProvider(): Signer | providers.Provider {
    return this.getSigner() || this.getProvider();
  }

  /**
   * @internal
   */
  public getConnectionInfo(): ConnectionInfo {
    return {
      chainId: this.chainId,
      signer: this.getSigner(),
      provider: this.getProvider(),
    };
  }
}
