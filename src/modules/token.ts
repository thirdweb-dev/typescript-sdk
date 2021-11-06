import { Coin, Coin__factory } from "@3rdweb/contracts";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
} from "../common/currency";
import { uploadMetadata } from "../common/ipfs";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 *
 * Access this module by calling {@link ThirdwebSDK.getCurrencyModule}
 * @public
 */
export class CurrencyModule extends ModuleWithRoles<Coin> {
  public static moduleType: ModuleType = ModuleType.CURRENCY as const;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.pauser,
    RolesMap.transfer,
  ] as const;

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return CurrencyModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): Coin {
    return Coin__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return CurrencyModule.moduleType;
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
    return await this.readOnlyContract.totalSupply();
  }

  public async balance(): Promise<CurrencyValue> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async balanceOf(address: string): Promise<CurrencyValue> {
    return await this.getValue(await this.readOnlyContract.balanceOf(address));
  }

  public async allowance(spender: string): Promise<BigNumber> {
    return await this.allowanceOf(await this.getSignerAddress(), spender);
  }

  public async allowanceOf(owner: string, spender: string): Promise<BigNumber> {
    return await this.readOnlyContract.allowance(owner, spender);
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
}
