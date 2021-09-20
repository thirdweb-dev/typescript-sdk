require("isomorphic-fetch");
import { Signer } from "@ethersproject/abstract-signer";
import { Network, Provider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { SubSDK } from "./sub-sdk";
import { ControlSDK } from "../control";
import { PackSDK } from "../pack";
import { MarketSDK } from "../market";
import { CoinSDK } from "../coin";
import { NFTSDK } from "../nft";

export type ProviderOrSigner = Provider | Signer;

export type ValidProviderInput = ProviderOrSigner | Network | string;

export interface SDKOptions {
  ipfsGatewayUrl: string;
}

export class CoreSDK {
  private providerOrSigner: ProviderOrSigner | null = null;
  private opts: SDKOptions;
  private modules: Record<string, SubSDK> = {};

  constructor(
    providerOrNetwork: ValidProviderInput,
    opts?: Partial<SDKOptions>,
  ) {
    if (
      Provider.isProvider(providerOrNetwork) ||
      Signer.isSigner(providerOrNetwork)
    ) {
      // sdk instantiated with a provider / signer
      this.providerOrSigner = providerOrNetwork;
    } else {
      // sdk instantiated with a network name / network url
      this.providerOrSigner = ethers.getDefaultProvider(providerOrNetwork);
    }

    this.opts = {
      ipfsGatewayUrl:
        opts?.ipfsGatewayUrl || "https://cloudflare-ipfs.com/ipfs/",
    };
  }

  private getOrCreateSDK<T extends SubSDK>(sdk: SubSDK): T {
    const address = sdk.address;
    if (!this.modules[address]) {
      this.modules[address] = sdk;
    }
    return this.modules[address] as T;
  }

  public getControlSDK(address: string): ControlSDK {
    return this.getOrCreateSDK(
      new ControlSDK(this.providerOrSigner, address, this.opts),
    );
  }

  public getPackSDK(address: string): PackSDK {
    return this.getOrCreateSDK(
      new PackSDK(this.providerOrSigner, address, this.opts),
    );
  }

  public getNFTSDK(address: string): NFTSDK {
    return this.getOrCreateSDK(
      new NFTSDK(this.providerOrSigner, address, this.opts),
    );
  }

  public getCoinSDK(address: string) {
    return this.getOrCreateSDK(
      new CoinSDK(this.providerOrSigner, address, this.opts),
    );
  }

  public getMarketSDK(address: string) {
    return this.getOrCreateSDK(
      new MarketSDK(this.providerOrSigner, address, this.opts),
    );
  }

  public async getSignerAddress(): Promise<string> {
    if (Signer.isSigner(this.providerOrSigner)) {
      return this.providerOrSigner.getAddress();
    }
    return "";
  }

  public setSigner(providerOrSigner?: ValidProviderInput): ProviderOrSigner {
    if (!Signer.isSigner(providerOrSigner)) {
      throw new Error("Not a valid signer");
    }

    // sdk instantiated with a provider / signer
    this.providerOrSigner = providerOrSigner;

    for (const name in this.modules) {
      this.modules[name].providerOrSigner = this.providerOrSigner;
    }

    return this.providerOrSigner;
  }
}
