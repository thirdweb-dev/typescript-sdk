import { AccessControlEnumerable, Forwarder__factory } from "@3rdweb/contracts";
import {
  JsonRpcSigner,
  Log,
  Provider,
  TransactionReceipt,
} from "@ethersproject/providers";
import { BaseContract, BigNumber, CallOverrides, ethers, Signer } from "ethers";
import type { ISDKOptions, ThirdwebSDK } from ".";
import { getContractMetadata, isContract } from "../common/contract";
import { ForwardRequest, getAndIncrementNonce } from "../common/forwarder";
import { getGasPriceForChain } from "../common/gas-price";
import { invariant } from "../common/invariant";
import { uploadMetadata } from "../common/ipfs";
import { ModuleType } from "../common/module-type";
import { getRoleHash, Role } from "../common/role";
import { ModuleMetadata } from "../types/ModuleMetadata";
import type { MetadataURIOrObject, ProviderOrSigner } from "./types";

/**
 * The root Module class. All other Modules extend this.
 * @remarks This should never be instantiated directly.
 * @public
 */
export class Module<TContract extends BaseContract = BaseContract> {
  /**
   * @readonly
   */
  public readonly address: string;
  /**
   * @internal
   * @readonly
   */
  protected readonly ipfsGatewayUrl: string;
  /**
   * @internal
   * @readonly
   */
  protected readonly options: ISDKOptions;

  protected readonly sdk: ThirdwebSDK;

  /**
   * @internal
   */
  private _providerOrSigner: ProviderOrSigner | null = null;
  /**
   * @internal
   */
  protected get providerOrSigner(): ProviderOrSigner {
    return this.signer || this._providerOrSigner || this.getProviderOrSigner();
  }

  private set providerOrSigner(value: ProviderOrSigner) {
    this._providerOrSigner = value;
  }

  /**
   * @internal
   */
  private _signer: Signer | null = null;
  /**
   * @internal
   */
  protected get signer(): Signer | null {
    return this._signer;
  }

  private set signer(value: Signer | null) {
    this._signer = value;
  }

  /**
   * Contract connects to the SDK signer or provider
   * @internal
   */
  public contract: TContract;
  /**
   * Contract connects to the {@link ISDKOptions.readOnlyRpcUrl} if provided, otherwise connect to signer or provider
   * @internal
   */
  public readOnlyContract: TContract;

  /**
   * @internal
   */
  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    options: ISDKOptions,
    sdk: ThirdwebSDK,
  ) {
    this.address = address;
    this.options = options;
    this.ipfsGatewayUrl = options.ipfsGatewayUrl;
    this.setProviderOrSigner(providerOrSigner);
    this.contract = this.connectContract();
    this.readOnlyContract = this.options.readOnlyRpcUrl
      ? (this.contract.connect(
          ethers.getDefaultProvider(this.options.readOnlyRpcUrl),
        ) as TContract)
      : this.contract;
    this.sdk = sdk;
  }

  /**
   * @public
   * @returns whether the given contract exists on-chain
   */
  public async exists(): Promise<boolean> {
    const provider = await this.getProvider();
    invariant(provider, "exists() -- No Provider");
    return isContract(provider, this.address);
  }

  /**
   * @public
   * Get the metadata of the contract.
   */
  public async getMetadata(): Promise<ModuleMetadata> {
    invariant(await this.exists(), "contract does not exist");
    const contract = this.connectContract();
    const type = this.getModuleType();

    return {
      metadata: await getContractMetadata(
        this.getProviderOrSigner(),
        contract.address,
        this.options.ipfsGatewayUrl,
      ),
      address: contract.address,
      type,
    };
  }

  /**
   * @public
   * Set new metadata on the contract and return it if successful.
   * @param metadata - The metadata to set.
   */
  public async setMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<ModuleMetadata> {
    invariant(await this.exists(), "contract does not exist");
    const uri = await uploadMetadata(metadata);
    await this.sendTransaction("setContractURI", [uri]);
    return this.getMetadata();
  }

  /**
   * @internal
   */
  public setProviderOrSigner(providerOrSigner: ProviderOrSigner) {
    this.providerOrSigner = providerOrSigner;
    if (Signer.isSigner(providerOrSigner)) {
      this.signer = providerOrSigner;
    }
    this.contract = this.connectContract();
    this.readOnlyContract = this.options.readOnlyRpcUrl
      ? (this.contract.connect(
          ethers.getDefaultProvider(this.options.readOnlyRpcUrl),
        ) as TContract)
      : this.contract;
  }

  /**
   * @internal
   */
  public clearSigner(): void {
    this.signer = null;
  }

  /**
   * @internal
   */
  private getProviderOrSigner(): ProviderOrSigner {
    return this.signer || this.providerOrSigner;
  }

  /**
   * @internal
   */
  protected getSigner(): Signer | null {
    if (Signer.isSigner(this.signer)) {
      return this.signer;
    }
    return null;
  }

  /**
   * @internal
   */
  protected hasValidSigner(): boolean {
    return Signer.isSigner(this.signer);
  }

  /**
   * @internal
   */
  protected async getSignerAddress(): Promise<string> {
    const signer = this.getSigner();
    invariant(signer, "Cannot get signer address without valid signer");
    return await signer.getAddress();
  }

  /**
   * @internal
   */
  protected async getProvider(): Promise<Provider | undefined> {
    const provider: Provider | undefined = Signer.isSigner(
      this.getProviderOrSigner(),
    )
      ? (this.providerOrSigner as Signer).provider
      : (this.providerOrSigner as Provider);
    return provider;
  }

  /**
   * @internal
   */
  protected async getChainID(): Promise<number> {
    const provider = await this.getProvider();
    invariant(provider, "getChainID() -- No Provider");
    const { chainId } = await provider.getNetwork();
    return chainId;
  }

  /**
   * @virtual
   * @internal
   */
  protected connectContract(): TContract {
    throw new Error("connectContract has to be implemented");
  }

  /**
   * @virtual
   * @internal
   */
  protected getModuleType(): ModuleType {
    throw new Error("getModuleType has to be implemented");
  }

  /**
   * @internal
   */
  protected async getCallOverrides(): Promise<CallOverrides> {
    const chainId = await this.getChainID();
    const speed = this.options.gasSpeed;
    const maxGasPrice = this.options.maxGasPriceInGwei;
    const gasPriceChain = await getGasPriceForChain(
      chainId,
      speed,
      maxGasPrice,
    );
    if (!gasPriceChain) {
      return {};
    }
    // TODO: support EIP-1559 by try-catch, provider.getFeeData();
    return {
      gasPrice: ethers.utils.parseUnits(gasPriceChain.toString(), "gwei"),
    };
  }

  /**
   * @internal
   */
  protected async sendTransaction(
    fn: string,
    args: any[],
    callOverrides?: CallOverrides,
  ): Promise<TransactionReceipt> {
    if (!callOverrides) {
      callOverrides = await this.getCallOverrides();
    }
    if (this.options.transactionRelayerUrl) {
      return await this.sendGaslessTransaction(fn, args, callOverrides);
    } else {
      return await this.sendAndWaitForTransaction(fn, args, callOverrides);
    }
  }

  /**
   * @internal
   */
  private async sendAndWaitForTransaction(
    fn: string,
    args: any[],
    callOverrides: CallOverrides,
  ): Promise<TransactionReceipt> {
    const contract = this.contract;
    const tx = await contract.functions[fn](...args, callOverrides);
    if (tx.wait) {
      return await tx.wait();
    }
    return tx;
  }

  /**
   * @internal
   */
  private async sendGaslessTransaction(
    fn: string,
    args: any[],
    callOverrides: CallOverrides,
  ): Promise<TransactionReceipt> {
    console.log("callOverrides", callOverrides);
    const signer = this.getSigner();
    invariant(
      signer,
      "Cannot execute gasless transaction without valid signer",
    );
    const provider = await this.getProvider();
    invariant(provider, "no provider to execute transaction");
    const chainId = await this.getChainID();
    const contract = this.contract;
    const from = await this.getSignerAddress();
    const to = this.address;
    const value = 0;
    const data = contract.interface.encodeFunctionData(fn, args);
    const gas = (await contract.estimateGas[fn](...args)).mul(2);
    const forwarderAddress = this.options.transactionRelayerForwarderAddress;
    const forwarder = Forwarder__factory.connect(
      forwarderAddress,
      this.getProviderOrSigner(),
    );
    const nonce = await getAndIncrementNonce(forwarder, from);

    const domain = {
      name: "GSNv2 Forwarder",
      version: "0.0.1",
      chainId,
      verifyingContract: forwarderAddress,
    };

    const types = {
      ForwardRequest,
    };

    const message = {
      from,
      to,
      value: BigNumber.from(value).toString(),
      gas: BigNumber.from(gas).toString(),
      nonce: BigNumber.from(nonce).toString(),
      data,
    };

    const signature = await (signer as JsonRpcSigner)._signTypedData(
      domain,
      types,
      message,
    );

    // await forwarder.verify(message, signature);
    const txHash = await this.options.transactionRelayerSendFunction(
      message,
      signature,
    );

    return await provider.waitForTransaction(txHash);
  }

  protected parseEventLogs(eventName: string, logs?: Log[]): any {
    if (!logs) {
      return null;
    }
    const contract = this.contract;
    for (const log of logs) {
      try {
        const event = contract.interface.decodeEventLog(
          eventName,
          log.data,
          log.topics,
        );
        return event;
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    return null;
  }
}

/**
 * Extends the {@link Module} class to add {@link Role} functionality.
 *
 * @public
 */
export class ModuleWithRoles<
  TContract extends AccessControlEnumerable = AccessControlEnumerable,
> extends Module<TContract> {
  /**
   * @virtual
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    throw new Error("getModuleRoles has to be implemented by a subclass");
  }

  /**
   * @internal
   */
  private get roles() {
    return this.getModuleRoles();
  }

  /** @internal */
  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    options: ISDKOptions,
    sdk: ThirdwebSDK,
  ) {
    super(providerOrSigner, address, options, sdk);
  }

  /**
   * Call this to get a list of addresses that are members of a specific role.
   *
   * @param role - The {@link IRoles | role} to to get a memberlist for.
   * @returns The list of addresses that are members of the specific role.
   * @throws If you are requestiong a role that does not exist on the module this will throw an {@link InvariantError}.
   * @see {@link ModuleWithRoles.getAllRoleMembers | getAllRoleMembers} to get get a list of addresses for all supported roles on the module.
   * @example Say you want to get the list of addresses that are members of the {@link IRoles.minter | minter} role.
   * ```typescript
   * const minterAddresses: string[] = await module.getRoleMemberList("minter");
   * ```
   *
   * @public
   */
  public async getRoleMembers(role: Role): Promise<string[]> {
    invariant(
      this.roles.includes(role),
      `this module does not support the "${role}" role`,
    );
    const contract = this.contract;
    const roleHash = getRoleHash(role);
    const count = (await contract.getRoleMemberCount(roleHash)).toNumber();
    return await Promise.all(
      Array.from(Array(count).keys()).map((i) =>
        contract.getRoleMember(roleHash, i),
      ),
    );
  }

  /**
   * Call this to get get a list of addresses for all supported roles on the module.
   *
   * @see {@link ModuleWithRoles.getRoleMembers | getRoleMembers} to get a list of addresses that are members of a specific role.
   * @returns A record of {@link Role}s to lists of addresses that are members of the given role.
   * @throws If the module does not support roles this will throw an {@link InvariantError}.
   *
   * @public
   */
  public async getAllRoleMembers(): Promise<Partial<Record<Role, string[]>>> {
    invariant(this.roles.length, "this module has no support for roles");
    const roles: Partial<Record<Role, string[]>> = {};
    for (const role of this.roles) {
      roles[role] = await this.getRoleMembers(role);
    }
    return roles;
  }

  /**
   * Call this to grant a role to a specific address.
   *
   * @remarks
   *
   * Make sure you are sure you want to grant the role to the address.
   *
   * @param role - The {@link IRoles | role} to grant to the address
   * @param address - The address to grant the role to
   * @returns The transaction receipt
   * @throws If you are trying to grant does not exist on the module this will throw an {@link InvariantError}.
   *
   * @public
   */
  public async grantRole(
    role: Role,
    address: string,
  ): Promise<TransactionReceipt> {
    invariant(
      this.roles.includes(role),
      `this module does not support the "${role}" role`,
    );
    return await this.sendTransaction("grantRole", [
      getRoleHash(role),
      address,
    ]);
  }

  /**
   * Call this to revoke a role from a specific address.
   *
   * @remarks
   *
   * -- Caution --
   *
   * This will let you remove yourself from the role, too.
   * If you remove yourself from the {@link IRoles.admin | admin} role, you will no longer be able to administer the module.
   * There is no way to recover from this.
   *
   * @param role - The {@link IRoles | role} to revoke
   * @param address - The address to revoke the role from
   * @returns The transaction receipt
   * @throws If you are trying to revoke does not exist on the module this will throw an {@link InvariantError}.
   *
   * @public
   */
  public async revokeRole(
    role: Role,
    address: string,
  ): Promise<TransactionReceipt> {
    invariant(
      this.roles.includes(role),
      `this module does not support the "${role}" role`,
    );
    const signerAddress = await this.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      return await this.sendTransaction("renounceRole", [
        getRoleHash(role),
        address,
      ]);
    } else {
      return await this.sendTransaction("revokeRole", [
        getRoleHash(role),
        address,
      ]);
    }
  }
}
