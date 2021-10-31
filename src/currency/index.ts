import { BigNumber, BigNumberish } from "ethers";
import { MetadataURIOrObject } from "../core/types";
import { Coin, Coin__factory } from "@3rdweb/contracts";
import { getRoleHash, ModuleType, Role } from "../common";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
import { uploadMetadata } from "../common/ipfs";
import { Module } from "../core/module";
import { TransactionReceipt } from "@ethersproject/providers";

/**
 * The CurrencyModule. This should always be created via `getCurrencyModule()` on the main SDK.
 * @public
 */
export class CurrencyModule extends Module {
  public static moduleType: ModuleType = ModuleType.CURRENCY;

  private __contract: Coin | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): Coin {
    return this.__contract || this.connectContract();
  }
  private set contract(value: Coin) {
    this.__contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): Coin {
    return (this.contract = Coin__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async get(): Promise<Currency> {
    return await getCurrencyMetadata(this.providerOrSigner, this.address);
  }

  public async getValue(value: BigNumberish): Promise<CurrencyValue> {
    return await getCurrencyValue(
      this.providerOrSigner,
      this.address,
      BigNumber.from(value),
    );
  }

  public async totalSupply(): Promise<BigNumber> {
    return await this.contract.totalSupply();
  }

  public async balanceOf(address: string): Promise<CurrencyValue> {
    return await this.getValue(await this.contract.balanceOf(address));
  }

  public async balance(): Promise<CurrencyValue> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async allowance(spender: string): Promise<BigNumber> {
    return await this.allowanceOf(await this.getSignerAddress(), spender);
  }

  public async allowanceOf(owner: string, spender: string): Promise<BigNumber> {
    return await this.contract.allowance(owner, spender);
  }

  public async getRoleMembers(role: Role): Promise<string[]> {
    const roleHash = getRoleHash(role);
    const count = (await this.contract.getRoleMemberCount(roleHash)).toNumber();
    return await Promise.all(
      Array.from(Array(count).keys()).map((i) =>
        this.contract.getRoleMember(roleHash, i),
      ),
    );
  }

  public async getAllRoleMembers(): Promise<Record<Role, string[]>> {
    const [admin, transfer, minter, pauser] = await Promise.all([
      this.getRoleMembers("admin"),
      this.getRoleMembers("transfer"),
      this.getRoleMembers("minter"),
      this.getRoleMembers("pauser"),
    ]);
    return {
      admin,
      transfer,
      minter,
      pauser,
    };
  }

  // write functions
  public async transfer(
    to: string,
    amount: BigNumber,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("transfer", [to, amount]);
  }

  public async setAllowance(
    spender: string,
    amount: BigNumber,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("approve", [spender, amount]);
  }

  // owner functions
  public async mint(amount: BigNumberish) {
    await this.mintTo(await this.getSignerAddress(), amount);
  }

  public async mintTo(to: string, amount: BigNumberish) {
    await this.sendTransaction("mint", [to, amount]);
  }

  public async burn(amount: BigNumberish): Promise<TransactionReceipt> {
    return await this.sendTransaction("burn", [amount]);
  }

  public async burnFrom(
    from: string,
    amount: BigNumberish,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("burnFrom", [from, amount]);
  }

  public async transferFrom(
    from: string,
    to: string,
    amount: BigNumberish,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("transferFrom", [from, to, amount]);
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRestrictedTransfer(
    restricted = false,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }

  // owner role functions
  public async grantRole(
    role: Role,
    address: string,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("grantRole", [
      getRoleHash(role),
      address,
    ]);
  }

  public async revokeRole(
    role: Role,
    address: string,
  ): Promise<TransactionReceipt> {
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
