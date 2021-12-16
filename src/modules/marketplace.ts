import { IMarketplace } from "../interfaces/modules";
import { Marketplace, Marketplace__factory } from "@3rdweb/contracts";
import { ModuleType, Role, RolesMap } from "../common";
import { ModuleWithRoles } from "../core/module";

/**
 * Access this module by calling {@link ThirdwebSDK.getMarketplaceModule}
 * @public
 */
export class MarketplaceModule
  extends ModuleWithRoles<Marketplace>
  implements IMarketplace
{
  public static moduleType: ModuleType = ModuleType.MARKETPLACE;

  public static roles = [
    RolesMap.admin,
    RolesMap.lister,
    RolesMap.pauser,
  ] as const;

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return MarketplaceModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): Marketplace {
    return Marketplace__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return MarketplaceModule.moduleType;
  }
}
