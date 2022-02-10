import { TransactionResultPromise } from "../types";
import { getRoleHash, Role } from "../../common/role";
import { AccessControlEnumerable } from "@3rdweb/contracts";
import invariant from "tiny-invariant";
import { ContractWrapper } from "./contract-wrapper";
import { MissingRoleError } from "../../common/error";

export class ContractRoles<
  TContract extends AccessControlEnumerable,
  TRole extends Role,
> {
  private contractWrapper;
  private readonly roles;

  constructor(
    contractWrapper: ContractWrapper<TContract>,
    roles: readonly TRole[],
  ) {
    this.contractWrapper = contractWrapper;
    this.roles = roles;
  }

  /** **************************
   * READ FUNCTIONS
   ****************************/

  /**
   * Call this to get get a list of addresses for all supported roles on the contract.
   *
   * @see {@link ContractWithRoles.getRoleMembers | getRoleMembers} to get a list of addresses that are members of a specific role.
   * @returns A record of {@link Role}s to lists of addresses that are members of the given role.
   * @throws If the contract does not support roles this will throw an {@link InvariantError}.
   *
   * @public
   */
  public async getAllMembers(): Promise<Record<TRole, string[]>> {
    invariant(this.roles.length, "this contract has no support for roles");
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
   * @throws If you are requestiong a role that does not exist on the contract this will throw an {@link InvariantError}.
   * @see {@link ContractWithRoles.getAllRoleMembers | getAllRoleMembers} to get get a list of addresses for all supported roles on the contract.
   * @example Say you want to get the list of addresses that are members of the {@link IRoles.minter | minter} role.
   * ```typescript
   * const minterAddresses: string[] = await contract.getRoleMemberList("minter");
   * ```
   *
   * @public
   */
  public async getRoleMembers(role: TRole): Promise<string[]> {
    invariant(
      this.roles.includes(role),
      `this contract does not support the "${role}" role`,
    );

    const roleHash = getRoleHash(role);
    const count = (
      await this.contractWrapper.readContract.getRoleMemberCount(roleHash)
    ).toNumber();
    return await Promise.all(
      Array.from(Array(count).keys()).map((i) =>
        this.contractWrapper.readContract.getRoleMember(roleHash, i),
      ),
    );
  }

  /**
     * Call this to OVERWRITE the list of addresses that are members of specific roles.
     *
     * Every role in the list will be overwritten with the new list of addresses provided with them.

    * If you want to add or remove addresses for a single address use {@link ContractWithRoles.grantRole | grantRole} and {@link ContractWithRoles.grantRole | revokeRole} respectively instead.
     * @param rolesWithAddresses - A record of {@link Role}s to lists of addresses that should be members of the given role.
     * @throws If you are requestiong a role that does not exist on the contract this will throw an {@link InvariantError}.
     * @example Say you want to overwrite the list of addresses that are members of the {@link IRoles.minter | minter} role.
     * ```typescript
     * const minterAddresses: string[] = await contract.getRoleMemberList("minter");
     * await contract.setAllRoleMembers({
     *  minter: []
     * });
     * console.log(await contract.getRoleMemberList("minter")); // No matter what members had the role before, the new list will be set to []
     * ```
     * @public
     *
     * */
  public async setAllRoleMembers(rolesWithAddresses: {
    [key in TRole]?: string[];
  }): TransactionResultPromise {
    const roles = Object.keys(rolesWithAddresses) as TRole[];
    invariant(roles.length, "you must provide at least one role to set");
    invariant(
      roles.every((role) => this.roles.includes(role)),
      "this contract does not support the given role",
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
              this.contractWrapper.readContract.interface.encodeFunctionData(
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
              this.contractWrapper.readContract.interface.encodeFunctionData(
                revokeFunctionName,
                [getRoleHash(role), address],
              ),
            );
          });
        }
      });
    return {
      receipt: await this.contractWrapper.multiCall(encoded),
    };
  }

  /**
   * Throws an error if an address is missing the roles specified.
   *
   * @param roles - The roles to check
   * @param address - The address to check
   *
   * @internal
   */
  public async onlyRoles(roles: TRole[], address: string): Promise<void> {
    await Promise.all(
      roles.map(async (role) => {
        const members = await this.getRoleMembers(role);
        if (
          !members.map((a) => a.toLowerCase()).includes(address.toLowerCase())
        ) {
          throw new MissingRoleError(address, role);
        }
      }),
    );
  }

  /** **************************
   * WRITE FUNCTIONS
   ****************************/

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
   * @throws If you are trying to grant does not exist on the contract this will throw an {@link InvariantError}.
   *
   * @public
   */
  public async grantRole(
    role: TRole,
    address: string,
  ): TransactionResultPromise {
    invariant(
      this.roles.includes(role),
      `this contract does not support the "${role}" role`,
    );
    return {
      receipt: await this.contractWrapper.sendTransaction("grantRole", [
        getRoleHash(role),
        address,
      ]),
    };
  }

  /** **************************
   * PRIVATE FUNCTIONS
   ****************************/

  private async getRevokeRoleFunctionName(address: string) {
    const signerAddress = await this.contractWrapper.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      return "renounceRole";
    }
    return "revokeRole";
  }
}
