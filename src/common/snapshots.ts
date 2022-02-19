import { IStorage } from "../core/interfaces/IStorage";
import MerkleTree from "merkletreejs";
import { SnapshotSchema } from "../schema/contracts/common/snapshots";
import { SnapshotInfo } from "../types/claim-conditions/PublicClaimCondition";
import { DuplicateLeafsError } from "./error";
import keccak256 from "keccak256";
import { BigNumber, BigNumberish, ethers } from "ethers";

/**
 * Create a snapshot (merkle tree) from a list of addresses and uploads it to IPFS
 * @param leafs - the list of addresses to hash
 * @returns the generated snapshot and URI
 */
export async function createSnapshot(
  leafs: string[],
  storage: IStorage,
  maxClaimablePerAddress?: number[],
): Promise<SnapshotInfo> {
  const hasDuplicates = new Set(leafs).size < leafs.length;
  if (hasDuplicates) {
    throw new DuplicateLeafsError();
  }

  let maxClaimable: BigNumberish[];
  if (maxClaimablePerAddress) {
    maxClaimable = maxClaimablePerAddress;
  } else {
    maxClaimable = Array(leafs.length).fill(0);
  }

  const hashedLeafs = leafs.map((l, index) =>
    hashLeafNode(l, maxClaimable[index]),
  );
  const tree = new MerkleTree(hashedLeafs, keccak256, {
    sort: true,
  });

  const snapshot = SnapshotSchema.parse({
    merkleRoot: tree.getHexRoot(),
    claims: leafs.map((l, index) => {
      const proof = tree.getHexProof(hashedLeafs[index]);
      return {
        address: l,
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

export function hashLeafNode(
  address: string,
  maxClaimableAmount: BigNumberish,
): string {
  return ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [address, BigNumber.from(maxClaimableAmount)],
  );
}
