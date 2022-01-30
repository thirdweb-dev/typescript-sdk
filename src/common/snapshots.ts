import { IStorage } from "../core/interfaces/IStorage";
import MerkleTree from "merkletreejs";
import { SnapshotSchema } from "../schema/modules/common/snapshots";
import { SnapshotInfo } from "../types/claim-conditions/PublicClaimCondition";
import { DuplicateLeafsError } from "./error";

/**
 * Create a snapshot (merkle tree) from a list of addresses and uploads it to IPFS
 * @param leafs - the list of addresses to hash
 * @returns the generated snapshot and URI
 */
export async function createSnapshot(
  leafs: string[],
  storage: IStorage,
): Promise<SnapshotInfo> {
  const hasDuplicates = new Set(leafs).size < leafs.length;
  if (hasDuplicates) {
    throw new DuplicateLeafsError();
  }

  const { default: keccak256 } = await import("keccak256");
  const hashedLeafs = leafs.map((l) => keccak256(l));
  const tree = new MerkleTree(hashedLeafs, keccak256, {
    sort: true,
  });

  const snapshot = SnapshotSchema.parse({
    merkleRoot: tree.getHexRoot(),
    claims: leafs.map((l) => {
      const proof = tree.getHexProof(keccak256(l));
      return {
        address: l,
        proof,
      };
    }),
  });

  const uri = await storage.upload(JSON.stringify(snapshot));
  return {
    merkleRoot: tree.getHexRoot(),
    snapshotUri: uri,
    snapshot,
  };
}
