import { IStorage } from "../core/interfaces/IStorage";
import MerkleTree from "merkletreejs";
import {
  SnapshotInputSchema,
  SnapshotSchema,
} from "../schema/contracts/common/snapshots";
import {
  SnapshotInfo,
  SnapshotInput,
} from "../types/claim-conditions/claim-conditions";
import { DuplicateLeafsError } from "./error";
import keccak256 from "keccak256";
import { BigNumber, BigNumberish, ethers } from "ethers";

/**
 * Create a snapshot (merkle tree) from a list of addresses and uploads it to IPFS
 * @param leafs - the list of addresses to hash
 * @returns the generated snapshot and URI
 * @internal
 */
export async function createSnapshot(
  snapshotInput: SnapshotInput,
  storage: IStorage,
): Promise<SnapshotInfo> {
  const input = SnapshotInputSchema.parse(snapshotInput);
  const hasDuplicates = new Set(input.addresses).size < input.addresses.length;
  if (hasDuplicates) {
    throw new DuplicateLeafsError();
  }

  let maxClaimable: BigNumberish[];
  if (input.maxClaimablePerAddress) {
    if (input.maxClaimablePerAddress.length !== input.addresses.length) {
      throw new Error(
        "maxClaimablePerAddress array must be the same length as as the addresses array",
      );
    }
    maxClaimable = input.maxClaimablePerAddress;
  } else {
    maxClaimable = Array(input.addresses.length).fill(0);
  }

  const hashedLeafs = input.addresses.map((l, index) =>
    hashLeafNode(l, maxClaimable[index]),
  );
  const tree = new MerkleTree(hashedLeafs, keccak256, {
    sort: true,
  });

  const snapshot = SnapshotSchema.parse({
    merkleRoot: tree.getHexRoot(),
    claims: input.addresses.map((l, index) => {
      const proof = tree.getHexProof(hashedLeafs[index]);
      return {
        address: l,
        maxClaimable: maxClaimable[index],
        proof,
      };
    }),
  });

  const uri = await storage.uploadMetadata(snapshot);
  return {
    merkleRoot: tree.getHexRoot(),
    snapshotUri: uri,
    snapshot,
  };
}

/**
 * Hash an address and the corresponding claimable amount
 * @internal
 * @param address
 * @param maxClaimableAmount
 */
export function hashLeafNode(
  address: string,
  maxClaimableAmount: BigNumberish,
): string {
  return ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [address, BigNumber.from(maxClaimableAmount)],
  );
}
