import { Royalty, Royalty__factory } from "@3rdweb/contracts";
import { ModuleType, Role, RolesMap } from "../common";
import { Currency, getCurrencyMetadata } from "../common/currency";
import { Module } from "../core/module";

/**
 *
 * Access this module by calling {@link ThirdwebSDK.getRoyaltyModule}
 * @public
 */
export class RoyaltyModule extends Module<Royalty> {
  public static moduleType: ModuleType = ModuleType.ROYALTY as const;

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
    return RoyaltyModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): Royalty {
    return Royalty__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return RoyaltyModule.moduleType;
  }

  public async get(): Promise<Currency> {
    return await getCurrencyMetadata(this.providerOrSigner, this.address);
  }
}
