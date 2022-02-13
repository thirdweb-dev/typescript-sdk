import {
  JsonRpcBatchProvider,
  Provider,
  WebSocketProvider,
} from "@ethersproject/providers";
import { ethers, Signer } from "ethers";
import { EventEmitter2 } from "eventemitter2";
import {
  SDKOptions,
  SDKOptionsOutput,
  SDKOptionsSchema,
} from "../../schema/sdk-options";
import { NetworkOrSignerOrProvider } from "../types";

/**
 * @internal
 */
export class RPCConnectionHandler extends EventEmitter2 {
  private provider: Provider;
  private signer: Signer | undefined;
  protected readonly options: SDKOptionsOutput;

  constructor(network: NetworkOrSignerOrProvider, options: SDKOptions) {
    super();
    const [signer, provider] = this.getSignerAndProvider(network, options);
    this.signer = signer;
    this.provider = provider;

    try {
      this.options = SDKOptionsSchema.parse(options);
    } catch (optionParseError) {
      console.error(
        "invalid sdk options object passed, falling back to default options",
        optionParseError,
      );
      this.options = SDKOptionsSchema.parse({});
    }
  }
  /**
   * The function to call whenever the network changes, such as when the users connects their wallet, disconnects their wallet, the connected chain changes, etc.
   *
   * @param network - a network, signer or provider that ethers js can interpret
   */
  public updateSignerOrProvider(network: NetworkOrSignerOrProvider) {
    const [signer, provider] = this.getSignerAndProvider(network, this.options);
    this.signer = signer;
    this.provider = provider;
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
  public getProvider(): Provider {
    return this.provider;
  }

  /**
   *
   * @returns the current signer if there is one, otherwise the active provider
   */
  public getSignerOrProvider(): Signer | Provider {
    return this.getSigner() || this.getProvider();
  }

  /** ********************
   * PRIVATE FUNCTIONS
   *********************/

  private getSignerAndProvider(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
  ): [Signer | undefined, Provider] {
    let signer: Signer | undefined;
    let provider: Provider | undefined;

    if (Signer.isSigner(network)) {
      signer = network;
      if (network.provider) {
        provider = network.provider;
      }
    }

    if (options?.readonlySettings) {
      provider = this.getReadOnlyProvider(
        options.readonlySettings.rpcUrl,
        options.readonlySettings.chainId,
      );
    }

    if (!provider) {
      if (Provider.isProvider(network)) {
        provider = network;
      } else if (!Signer.isSigner(network)) {
        if (typeof network === "string") {
          provider = this.getReadOnlyProvider(
            network,
            options?.readonlySettings?.chainId,
          );
        } else {
          // no a signer, not a provider, not a string? try with default provider
          provider = ethers.getDefaultProvider(network);
        }
      }
    }

    if (!provider) {
      // we should really never hit this case!
      provider = ethers.getDefaultProvider();
      console.error(
        "No provider found, using default provider on default chain!",
      );
    }

    return [signer, provider];
  }

  private getReadOnlyProvider(network: string, chainId?: number) {
    try {
      const match = network.match(/^(ws|http)s?:/i);
      // try the JSON batch provider if available
      if (match) {
        switch (match[1]) {
          case "http":
            return new JsonRpcBatchProvider(network, chainId);
          case "ws":
            return new WebSocketProvider(network, chainId);
          default:
            return ethers.getDefaultProvider(network);
        }
      } else {
        return ethers.getDefaultProvider(network);
      }
    } catch (e) {
      // fallback to the default provider
      return ethers.getDefaultProvider(network);
    }
  }
}
