import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { BaseContract, CallOverrides, Signer } from "ethers";
import invariant from "ts-invariant";
import type { ProviderOrSigner } from "./types";
import type { ISDKOptions } from ".";
import { getTransactionCallOverrides } from "../common/transaction";
import { isContract } from "../common/contract";
import { ForwardRequest, getAndIncrementNonce } from "../common/forwarder";
import { Forwarder__factory } from "../../contract-interfaces";
import { FORWARDER_ADDRESS } from "../common/address";

/**
 *
 * The root Module class to be extended and not used directly!
 * @internal
 *
 */
export class Module {
  public readonly address: string;
  protected readonly ipfsGatewayUrl: string;
  protected readonly options: ISDKOptions;

  private _providerOrSigner: ProviderOrSigner | null = null;
  protected get providerOrSigner(): ProviderOrSigner {
    return this.signer || this._providerOrSigner || this.getProviderOrSigner();
  }
  private set providerOrSigner(value: ProviderOrSigner) {
    this._providerOrSigner = value;
  }

  private _signer: Signer | null = null;
  protected get signer(): Signer | null {
    return this._signer;
  }
  private set signer(value: Signer | null) {
    this._signer = value;
  }

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    options: ISDKOptions,
  ) {
    this.address = address;
    this.options = options;
    this.ipfsGatewayUrl = options.ipfsGatewayUrl;
    this.setProviderOrSigner(providerOrSigner);
  }

  /*
   * @internal
   */
  public setProviderOrSigner(providerOrSigner: ProviderOrSigner) {
    this.providerOrSigner = providerOrSigner;
    if (Signer.isSigner(providerOrSigner)) {
      this.signer = providerOrSigner;
    }
    this.connectContract();
  }

  /*
   * @internal
   */
  public clearSigner(): void {
    this.signer = null;
  }

  private getProviderOrSigner(): ProviderOrSigner {
    return this.signer || this.providerOrSigner;
  }

  protected getSigner(): Signer | null {
    if (Signer.isSigner(this.signer)) {
      return this.signer;
    }
    return null;
  }

  protected hasValidSigner(): boolean {
    return Signer.isSigner(this.signer);
  }

  protected async getSignerAddress(): Promise<string> {
    const signer = this.getSigner();
    invariant(signer, "Cannot get signer address without valid signer");
    return await signer.getAddress();
  }

  protected async getProvider(): Promise<Provider | undefined> {
    const provider: Provider | undefined = Signer.isSigner(
      this.getProviderOrSigner(),
    )
      ? (this.providerOrSigner as Signer).provider
      : (this.providerOrSigner as Provider);
    return provider;
  }

  protected async getChainID(): Promise<number> {
    const provider = await this.getProvider();
    invariant(provider, "getChainID() -- No Provider");
    const { chainId } = await provider.getNetwork();
    return chainId;
  }

  protected connectContract(): BaseContract {
    throw new Error("connectContract has to be implemented");
  }

  protected async getCallOverrides(): Promise<CallOverrides | undefined> {
    return await getTransactionCallOverrides(
      await this.getChainID(),
      this.options.gasSpeed,
      this.options.maxGasPriceInGwei,
    );
  }

  public async exists(): Promise<boolean> {
    const provider = await this.getProvider();
    invariant(provider, "exists() -- No Provider");
    return isContract(provider, this.address);
  }

  protected async execute(fn: string, ...args: any[]): Promise<string> {
    const contract = this.connectContract();
    const data = contract.interface.encodeFunctionData(fn, args);
    console.log("execute", fn, args, "data:", data);
    this.executeGasless(fn, ...args);
    return "";
  }

  private async executeGasless(fn: string, ...args: any[]): Promise<string> {
    const signer = this.getSigner();
    invariant(
      signer,
      "Cannot execute gasless transaction without valid signer",
    );
    const chainId = await this.getChainID();
    const contract = this.connectContract();
    const from = await this.getSignerAddress();
    const to = this.address;
    const value = 0;
    const data = contract.interface.encodeFunctionData(fn, args);
    const gas = (await contract.estimateGas[fn](...args)).mul(2);
    const forwarder = Forwarder__factory.connect(
      FORWARDER_ADDRESS,
      this.getProviderOrSigner(),
    );
    const nonce = await getAndIncrementNonce(forwarder, from);

    const domain = {
      name: "GSNv2 Forwarder",
      version: "0.0.1",
      chainId,
      verifyingContract: FORWARDER_ADDRESS,
    };

    const types = {
      ForwardRequest,
    };

    const message = {
      from,
      to,
      value,
      gas,
      nonce,
      data,
    };

    const signature = await (signer as JsonRpcSigner)._signTypedData(
      domain,
      types,
      message,
    );
    console.log("fowradr verfify", await forwarder.verify(message, signature));
    // TODO relayer api call
    return "";
  }
}
