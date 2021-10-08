import { BytesLike, ethers } from "ethers";

export type Role = "admin" | "minter" | "pauser" | "transfer";

/**
 *
 * @internal
 */
const _role: Record<Role, string> = {
  admin: "",
  transfer: "TRANSFER_ROLE",
  minter: "MINTER_ROLE",
  pauser: "PAUSER_ROLE",
};

export function getRoleHash(role: Role): BytesLike {
  if (role === "admin") {
    return ethers.utils.hexZeroPad([0], 32);
  }
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_role[role]));
}
