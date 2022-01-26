import { getRoleHash, RoleName, SetAllRoles } from "../../common/role";
import { AccessControlEnumerable } from "@3rdweb/contracts";
import { BaseContract } from "@ethersproject/contracts";
import invariant from "tiny-invariant";
import { ContractWrapper } from "./contract-wrapper";

export class ContractRoles<
  TContract extends BaseContract,
  TRole extends RoleName,
> {
  private contractWrapper: ContractWrapper<TContract>;
  private roles: readonly TRole[];

  constructor(
    contractWrapper: ContractWrapper<TContract>,
    roles: readonly TRole[],
  ) {
    this.contractWrapper = contractWrapper;
    this.roles = roles;
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
  public async getAllMembers() {
    invariant(this.roles.length, "this module has no support for roles");
    const roles = {} as Record<TRole, string[]>;
    for (const role of this.roles) {
      roles[role] = await this.getRoleMembers(role);
    }
    return roles;
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
  public async getRoleMembers(role: TRole): Promise<string[]> {
    invariant(
      this.roles.includes(role),
      `this module does not support the "${role}" role`,
    );
    const contract = this.readOnlyAccessControl();
    const roleHash = getRoleHash(role);
    const count = (await contract.getRoleMemberCount(roleHash)).toNumber();
    return await Promise.all(
      Array.from(Array(count).keys()).map((i) =>
        contract.getRoleMember(roleHash, i),
      ),
    );
  }

  /**
     * Call this to OVERWRITE the list of addresses that are members of specific roles.
     *
     * Every role in the list will be overwritten with the new list of addresses provided with them.

    * If you want to add or remove addresses for a single address use {@link ModuleWithRoles.grantRole | grantRole} and {@link ModuleWithRoles.grantRole | revokeRole} respectively instead.
     * @param rolesWithAddresses - A record of {@link Role}s to lists of addresses that should be members of the given role.
     * @throws If you are requestiong a role that does not exist on the module this will throw an {@link InvariantError}.
     * @example Say you want to overwrite the list of addresses that are members of the {@link IRoles.minter | minter} role.
     * ```typescript
     * const minterAddresses: string[] = await module.getRoleMemberList("minter");
     * await module.setAllRoleMembers({
     *  minter: []
     * });
     * console.log(await module.getRoleMemberList("minter")); // No matter what members had the role before, the new list will be set to []
     * ```
     * @public
     *
     * */
  public async setAllRoleMembers(
    rolesWithAddresses: SetAllRoles<TRole>,
  ): Promise<any> {
    const roles = Object.keys(rolesWithAddresses) as TRole[];
    invariant(roles.length, "you must provide at least one role to set");
    invariant(
      roles.every((role) => this.roles.includes(role)),
      "this module does not support the given role",
    );
    const currentRoles = await this.getAllMembers();
    const encoded: string[] = [];
    // add / remove admin role at the end so we don't revoke admin then grant
    roles
      .sort((role) => (role === "admin" ? 1 : -1))
      .forEach(async (role) => {
        const addresses: string[] = rolesWithAddresses[role] || [];
        const currentAddresses = currentRoles[role] || [];
        const toAdd = addresses.filter(
          (address) => !currentAddresses.includes(address),
        );
        const toRemove = currentAddresses.filter(
          (address) => !addresses.includes(address),
        );
        if (toAdd.length) {
          toAdd.forEach((address) => {
            encoded.push(
              this.writeAccessControl().interface.encodeFunctionData(
                "grantRole",
                [getRoleHash(role), address],
              ),
            );
          });
        }
        if (toRemove.length) {
          toRemove.forEach(async (address) => {
            const revokeFunctionName = (await this.getRevokeRoleFunctionName(
              address,
            )) as any;
            encoded.push(
              this.writeAccessControl().interface.encodeFunctionData(
                revokeFunctionName,
                [getRoleHash(role), address],
              ),
            );
          });
        }
      });
    return await this.contractWrapper.sendTransaction("multicall", [encoded]);
  }

  private async getRevokeRoleFunctionName(address: string): Promise<string> {
    const signerAddress = await this.contractWrapper.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      return "renounceRole";
    }
    return "revokeRole";
  }

  // FIXME hacky type bypass bacause of conflicting `contractName` between actual module contract and AccessControlEnumerable contract
  // Should be able to turn off `contractName` generation from the ts contract wrapper generator
  private readOnlyAccessControl(): AccessControlEnumerable {
    return this.contractWrapper
      .readOnlyContract as unknown as AccessControlEnumerable;
  }

  private writeAccessControl(): AccessControlEnumerable {
    return this.contractWrapper.contract as unknown as AccessControlEnumerable;
  }
}
