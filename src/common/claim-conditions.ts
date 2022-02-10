import { BigNumber, BigNumberish, BytesLike, CallOverrides } from "ethers";
import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { SnapshotInputSchema } from "../schema/contracts/common/snapshots";
import { approveErc20Allowance, isNativeToken } from "./currency";
import { ClaimCondition } from "../types";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { IStorage } from "../core";

/**
 * Returns proofs and the overrides required for the transaction.
 *
 * @returns - `overrides` and `proofs` as an object.
 */
export async function prepareClaim(
  quantity: BigNumberish,
  activeClaimCondition: ClaimCondition,
  merkleMetadata: Record<string, string>,
  contractWrapper: ContractWrapper<any>,
  storage: IStorage,
  proofs: BytesLike[] = [hexZeroPad([0], 32)],
): Promise<{
  overrides: CallOverrides;
  proofs: BytesLike[];
}> {
  const addressToClaim = await contractWrapper.getSignerAddress();

  if (!activeClaimCondition.merkleRootHash.toString().startsWith(AddressZero)) {
    const snapshot = await storage.get(
      merkleMetadata[activeClaimCondition.merkleRootHash.toString()],
    );
    const snapshotData = SnapshotInputSchema.parse(snapshot);
    const item = snapshotData.claims.find(
      (c) => c.address.toLowerCase() === addressToClaim.toLowerCase(),
    );
    if (item === undefined) {
      throw new Error("No claim found for this address");
    }
    proofs = item.proof;
  }

  const overrides = (await contractWrapper.getCallOverrides()) || {};
  const price = activeClaimCondition.price;
  const currencyAddress = activeClaimCondition.currencyAddress;
  if (price.gt(0)) {
    if (isNativeToken(currencyAddress)) {
      overrides["value"] = BigNumber.from(price).mul(quantity);
    } else {
      await approveErc20Allowance(
        contractWrapper,
        currencyAddress,
        price,
        quantity,
      );
    }
  }
  return {
    overrides,
    proofs,
  };
}
