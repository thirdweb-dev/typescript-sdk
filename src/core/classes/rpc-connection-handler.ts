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

export class RPCConnectionHandler extends EventEmitter2 {
  private network: NetworkOrSignerOrProvider;
  private provider: Provider;
  private signer: Signer | undefined = undefined;
  protected readonly options: SDKOptionsOutput;

  constructor(network: NetworkOrSignerOrProvider, options: SDKOptions) {
    super();
    this.network = network;
    let provider: Provider | undefined;
    if (Signer.isSigner(network)) {
      this.signer = network;
      if (network.provider) {
        provider = network.provider;
      }
    }
    if (!provider) {
      if (Provider.isProvider(network)) {
        provider = network;
      } else if (!Signer.isSigner(network)) {
        if (typeof network === "string") {
          // try the JSON batch provider if available
          try {
            const match = network.match(/^(ws|http)s?:/i);
            if (match) {
              switch (match[1]) {
                case "http":
                  provider = new JsonRpcBatchProvider(network);
                case "ws":
                  provider = new WebSocketProvider(network);
                default:
                  break;
              }
            }
          } catch (e) {
            // fallback to the default provider
            provider = ethers.getDefaultProvider(network);
          }
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
    this.network = network;
    let provider: Provider | undefined;
    if (Signer.isSigner(network)) {
      this.signer = network;
      if (network.provider) {
        provider = network.provider;
      }
    }
    if (!provider) {
      if (Provider.isProvider(network)) {
        provider = network;
      } else if (!Signer.isSigner(network)) {
        // if the provider is not set, we'll use the default provider
        // this will happen if the passed in network is neither a signer nor a provider
        provider = ethers.getDefaultProvider(network);
      }
    }

    if (!provider) {
      // we should really never hit this case!
      provider = ethers.getDefaultProvider();
      console.error(
        "No provider found, using default provider on default chain!",
      );
    }

    this.provider = provider;
  }

  /**
   *
   * @returns the last updated network
   */
  public getNetwork() {
    return this.network;
  }

  /**
   *
   * @returns whether or not a signer is set, `true` if there is no signer so the class is in "read only" mode
   */
  public isReadOnly(): boolean {
    return !Signer.isSigner(this.signer);
  }

  /**
   *
   * @returns the active signer, if there is one
   */
  public getSigner(): Signer | undefined {
    return this.signer;
  }

  /**
   *
   * @returns the active provider
   */
  public getProvider(): Provider {
    return this.provider;
  }
}
