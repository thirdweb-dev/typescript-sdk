import { BigNumber, BigNumberish } from "ethers";
import { MetadataURIOrObject } from "../core/types";
import { Coin, Coin__factory } from "../../contract-interfaces";
import { getRoleHash, ModuleType, Role } from "../common";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
import { uploadMetadata } from "../common/ipfs";
import { Module } from "../core/module";

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

  // passthrough to the contract
  public async balanceOf(address: string): Promise<CurrencyValue> {
    return await this.getValue(await this.contract.balanceOf(address));
  }

  public async balance(): Promise<CurrencyValue> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async transfer(to: string, amount: BigNumber) {
    const tx = await this.contract.transfer(
      to,
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async allowance(spender: string): Promise<BigNumber> {
    return await this.contract.allowance(
      await this.getSignerAddress(),
      spender,
    );
  }

  public async setAllowance(spender: string, amount: BigNumber) {
    const tx = await this.contract.approve(
      spender,
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  // owner functions
  public async mintTo(to: string, amount: BigNumberish) {
    const tx = await this.contract.mint(
      to,
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async mint(amount: BigNumberish) {
    const tx = await this.contract.mint(
      await this.getSignerAddress(),
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async burn(amount: BigNumberish) {
    const tx = await this.contract.burn(amount, await this.getCallOverrides());
    await tx.wait();
  }

  public async burnFrom(from: string, amount: BigNumberish) {
    const tx = await this.contract.burnFrom(
      from,
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async transferFrom(from: string, to: string, amount: BigNumberish) {
    const tx = await this.contract.transferFrom(
      from,
      to,
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async setModuleMetadata(metadata: MetadataURIOrObject) {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.setContractURI(
      uri,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  // owner role functions
  public async grantRole(role: Role, address: string) {
    const tx = await this.contract.grantRole(
      getRoleHash(role),
      address,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async revokeRole(role: Role, address: string) {
    const signerAddress = await this.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      const tx = await this.contract.renounceRole(
        getRoleHash(role),
        address,
        await this.getCallOverrides(),
      );
      await tx.wait();
    } else {
      const tx = await this.contract.revokeRole(
        getRoleHash(role),
        address,
        await this.getCallOverrides(),
      );
      await tx.wait();
    }
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
}
