import { Coin, Coin__factory } from "@3rdweb/contracts";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish } from "ethers";
import { ModuleType, Role, ROLES } from "../common";
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
 * The CurrencyModule. This should always be created via `getCurrencyModule()` on the main SDK.
 * @public
 */
export class CurrencyModule extends ModuleWithRoles {
  public static moduleType: ModuleType = ModuleType.CURRENCY;

  public static roles = [
    ROLES.admin,
    ROLES.minter,
    ROLES.pauser,
    ROLES.transfer,
  ];

  protected getModuleRoles(): Role[] {
    return CurrencyModule.roles;
  }

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
