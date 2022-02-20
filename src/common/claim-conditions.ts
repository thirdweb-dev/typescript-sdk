import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { SnapshotJSONInputSchema } from "../schema/contracts/common/snapshots";
import { approveErc20Allowance, isNativeToken } from "./currency";
import {
  ClaimCondition,
  ClaimConditionInput,
  ClaimVerification,
} from "../types";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { IStorage } from "../core";
import {
  ClaimConditionInputSchema,
  ClaimConditionOutputSchema,
} from "../schema/contracts/common/claim-conditions";

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
): Promise<ClaimVerification> {
  const addressToClaim = await contractWrapper.getSignerAddress();
  let maxClaimable = 0;

  if (!activeClaimCondition.merkleRootHash.toString().startsWith(AddressZero)) {
    const snapshot = await storage.get(
      merkleMetadata[activeClaimCondition.merkleRootHash.toString()],
    );
    const snapshotData = SnapshotJSONInputSchema.parse(snapshot);
    const item = snapshotData.claims.find(
      (c) => c.address.toLowerCase() === addressToClaim.toLowerCase(),
    );
    if (item === undefined) {
      throw new Error("No claim found for this address");
    }
    proofs = item.proof;
    maxClaimable = item.maxClaimable;
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
    maxQuantityPerTransaction: BigNumber.from(maxClaimable),
    price,
    currencyAddress,
  };
}

export function updateExsitingClaimConditions(
  index: number,
  claimConditionInput: ClaimConditionInput,
  existingConditions: ClaimCondition[],
): ClaimConditionInput[] {
  if (index >= existingConditions.length) {
    throw Error(
      `Index out of bounds - got index: ${index} with ${existingConditions.length} conditions`,
    );
  }
  // merge input with existing claim condition
  const newConditionParsed = ClaimConditionInputSchema.parse({
    ...existingConditions[index],
    price: existingConditions[index].price.toString(),
    ...claimConditionInput,
  });
  // convert to output claim condition
  const mergedConditionOutput =
    ClaimConditionOutputSchema.parse(newConditionParsed);

  return existingConditions.map((existingOutput, i) => {
    let newConditionAtIndex;
    if (i === index) {
      newConditionAtIndex = mergedConditionOutput;
    } else {
      newConditionAtIndex = existingOutput;
    }
    return {
      ...newConditionAtIndex,
      price: newConditionAtIndex.price.toString(), // manually transform back to input price type
    };
  });
}
