import { ethers } from "ethers";

export type Role = "admin" | "minter" | "pauser" | "transfer" | "provider";

/**
 *
 * @internal
 */
const _role: Record<Role, string> = {
  provider: "PROTOCOL_PROVIDER",
  admin: "PROTOCOL_ADMIN",
  transfer: "TRANSFER_ROLE",
  minter: "MINTER_ROLE",
  pauser: "PAUSER_ROLE",
};

export function getRoleHash(role: Role): string {
  return ethers.utils.keccak256(_role[role]);
}
