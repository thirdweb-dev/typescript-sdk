import { BytesLike, ethers } from "ethers";

const admin = "admin" as const;
const minter = "minter" as const;
const pauser = "pauser" as const;
const transfer = "transfer" as const;
const editor = "editor" as const;
const lister = "lister" as const;

/**
 * @internal
 */
export const ROLES = {
  admin,
  minter,
  pauser,
  transfer,
  editor,
  lister,
};

/**
 * Rs that are used for permissions on the contract.
 * @public
 */
export type Role = typeof ROLES[keyof typeof ROLES];

/**
 *
 * @internal
 */
const _role: Record<Role, string> = {
  admin: "",
  transfer: "TRANSFER_ROLE",
  minter: "MINTER_ROLE",
  pauser: "PAUSER_ROLE",
  editor: "EDITOR_ROLE",
  lister: "LISTER_ROLE",
};

/**
 * @internal
 */
export function getRoleHash(role: Role): BytesLike {
  if (role === "admin") {
    return ethers.utils.hexZeroPad([0], 32);
  }
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_role[role]));
}
