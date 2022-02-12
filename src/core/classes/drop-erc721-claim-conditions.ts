import { IStorage } from "../interfaces/IStorage";
import { SnapshotSchema } from "../../schema/contracts/common/snapshots";
import { DropErc721ContractSchema } from "../../schema/contracts/drop-erc721";
import { ContractMetadata } from "./contract-metadata";
import {
  DropERC721,
  IDropERC721,
  IERC20,
  IERC20__factory,
} from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  fetchCurrencyValue,
  isNativeToken,
  normalizePriceValue,
} from "../../common/currency";
import { ContractWrapper } from "./contract-wrapper";
import {
  ClaimCondition,
  ClaimConditionInput,
  FilledConditionInput,
  SnapshotInfo,
} from "../../types";
import deepEqual from "deep-equal";
import { ClaimEligibility } from "../../enums";
import { createSnapshot } from "../../common";
import {
  ClaimConditionInputSchema,
  ClaimConditionOutputSchema,
} from "../../schema/contracts/common/claim-conditions";
import { TransactionResult } from "../index";
import { NATIVE_TOKEN_ADDRESS } from "../../constants/currency";

/**
 * Manages claim conditions for NFT Drop contracts
 */
export class DropErc721ClaimConditions {
  private contractWrapper;
  private metadata;
  private storage: IStorage;

  constructor(
    contractWrapper: ContractWrapper<DropERC721>,
    metadata: ContractMetadata<DropERC721, typeof DropErc721ContractSchema>,
    storage: IStorage,
  ) {
    this.storage = storage;
    this.contractWrapper = contractWrapper;
    this.metadata = metadata;
  }

  /** ***************************************
   * READ FUNCTIONS
   *****************************************/

  /**
   * Get the currently active claim condition
   *
   * @returns the claim condition metadata
   */
  public async getActive(): Promise<ClaimCondition> {
    const index =
      await this.contractWrapper.readContract.getIndexOfActiveCondition();
    const mc = await this.contractWrapper.readContract.getClaimConditionAtIndex(
      index,
    );
    return await this.transformResultToClaimCondition(mc);
  }

  /**
   * Get all the claim conditions
   *
   * @returns the claim conditions metadata
   */
  public async getAll(): Promise<ClaimCondition[]> {
    const claimCondition =
      await this.contractWrapper.readContract.claimConditions();
    const count = claimCondition.totalConditionCount.toNumber();
    const conditions = [];
    for (let i = 0; i < count; i++) {
      conditions.push(
        await this.contractWrapper.readContract.getClaimConditionAtIndex(i),
      );
    }
    return Promise.all(
      conditions.map((c) => this.transformResultToClaimCondition(c)),
    );
  }

  /**
   * Can Claim
   *
   * @remarks Check if the drop can currently be claimed.
   *
   * @example
   * ```javascript
   * // Quantity of tokens to check claimability of
   * const quantity = 1;
   * const canClaim = await contract.canClaim(quantity);
   * ```
   */
  public async canClaim(
    quantity: BigNumberish,
    addressToCheck?: string,
  ): Promise<boolean> {
    if (addressToCheck === undefined) {
      addressToCheck = await this.contractWrapper.getSignerAddress();
    }
    return (
      (await this.getClaimIneligibilityReasons(quantity, addressToCheck))
        .length === 0
    );
  }

  /**
   * For any claim conditions that a particular wallet is violating,
   * this function returns human readable information about the
   * breaks in the condition that can be used to inform the user.
   *
   * @param quantity - The desired quantity that would be claimed.
   * @param addressToCheck - The wallet address, defaults to the connected wallet.
   *
   */
  public async getClaimIneligibilityReasons(
    quantity: BigNumberish,
    addressToCheck?: string,
  ): Promise<ClaimEligibility[]> {
    const reasons: ClaimEligibility[] = [];
    let activeConditionIndex: BigNumber;
    let claimCondition: ClaimCondition;

    if (addressToCheck === undefined) {
      throw new Error("addressToCheck is required");
    }

    try {
      [activeConditionIndex, claimCondition] = await Promise.all([
        this.contractWrapper.readContract.getIndexOfActiveCondition(),
        this.getActive(),
      ]);
    } catch (err: any) {
      if ((err.message as string).includes("no public mint condition.")) {
        reasons.push(ClaimEligibility.NoActiveClaimPhase);
        return reasons;
      }
      console.error("Failed to get active claim condition", err);
      throw new Error("Failed to get active claim condition");
    }

    if (BigNumber.from(claimCondition.availableSupply).lt(quantity)) {
      reasons.push(ClaimEligibility.NotEnoughSupply);
    }

    // check for merkle root inclusion
    const merkleRootArray = ethers.utils.stripZeros(
      claimCondition.merkleRootHash,
    );
    if (merkleRootArray.length > 0) {
      const merkleLower = claimCondition.merkleRootHash.toString();
      const proofs = await this.getClaimerProofs(merkleLower, addressToCheck);
      if (proofs.length === 0) {
        const hashedAddress = ethers.utils
          .keccak256(addressToCheck)
          .toLowerCase();
        if (hashedAddress !== merkleLower) {
          reasons.push(ClaimEligibility.AddressNotAllowed);
        }
      }
      // TODO: compute proofs to root, need browser compatibility
    }

    // check for claim timestamp between claims
    const timestampForNextClaim =
      await this.contractWrapper.readContract.getTimestampForNextValidClaim(
        activeConditionIndex,
        addressToCheck,
      );

    const now = BigNumber.from(Date.now()).div(1000);
    if (now.lt(timestampForNextClaim)) {
      // if waitTimeSecondsLimitPerTransaction equals to timestampForNextClaim, that means that this is the first time this address claims this token
      if (
        BigNumber.from(claimCondition.waitInSeconds).eq(timestampForNextClaim)
      ) {
        const balance = await this.contractWrapper.readContract.balanceOf(
          addressToCheck,
        );
        if (balance.gte(1)) {
          reasons.push(ClaimEligibility.AlreadyClaimed);
        }
      } else {
        reasons.push(ClaimEligibility.WaitBeforeNextClaimTransaction);
      }
    }

    // check for wallet balance
    if (claimCondition.price.gt(0)) {
      const totalPrice = claimCondition.price.mul(quantity);
      const provider = this.contractWrapper.getProvider();
      if (isNativeToken(claimCondition.currencyAddress)) {
        const balance = await provider.getBalance(addressToCheck);
        if (balance.lt(totalPrice)) {
          reasons.push(ClaimEligibility.NotEnoughTokens);
        }
      } else {
        const erc20 = new ContractWrapper<IERC20>(
          provider,
          claimCondition.currencyAddress,
          IERC20__factory.abi,
          {},
        );
        const balance = await erc20.readContract.balanceOf(addressToCheck);
        if (balance.lt(totalPrice)) {
          reasons.push(ClaimEligibility.NotEnoughTokens);
        }
      }
    }

    return reasons;
  }

  /** ***************************************
   * WRITE FUNCTIONS
   *****************************************/

  /**
   * Set public mint conditions
   *
   * @remarks Sets the public mint conditions that need to be fullfiled by users to claim NFTs.
   *
   * @example
   * ```javascript
   * const now = Math.floor(new Date().getTime()) / 1000;
   * const claimConditions = [
   *   {
   *     startTime: now, // start the presale now
   *     maxQuantity: 2, // limit how many mints for this presale
   *     price: 0.01, // presale price
   *     snapshot: ['0x...', '0x...'], // limit minting to only certain addresses
   *   },
   *   {
   *     startTime: now + 60 * 60 * 24, // 24h after presale, start public sale
   *     price: 0.08, // public sale price
   *   }
   * ]);
   *
   * await dropContract.claimConditions.set(claimConditions);
   * ```
   *
   * @param claimConditionInputs - The claim conditions
   * @param resetClaimEligibilityForAll - Whether to reset the state of who already claimed NFTs previously
   */
  public async set(
    claimConditionInputs: ClaimConditionInput[],
    resetClaimEligibilityForAll = false,
  ): Promise<TransactionResult> {
    // process inputs
    const snapshotInfos: SnapshotInfo[] = [];
    const inputsWithSnapshots: FilledConditionInput[] = await Promise.all(
      claimConditionInputs.map(async (conditionInput) => {
        // check snapshots and upload if provided
        if (conditionInput.snapshot) {
          const snapshotInfo = await createSnapshot(
            conditionInput.snapshot,
            this.storage,
          );
          snapshotInfos.push(snapshotInfo);
          conditionInput.merkleRootHash = snapshotInfo.merkleRoot;
        }
        // fill condition with defaults values if not provided
        return ClaimConditionInputSchema.parse(conditionInput);
      }),
    );

    // Convert processed inputs to the format the contract expects, and sort by timestamp
    const sortedConditions: IDropERC721.ClaimConditionStruct[] = (
      await Promise.all(inputsWithSnapshots.map(this.convertToContractModel))
    ).sort((a, b) => {
      const left = BigNumber.from(a.startTimestamp);
      const right = BigNumber.from(b.startTimestamp);
      if (left.eq(right)) {
        return 0;
      } else if (left.gt(right)) {
        return 1;
      } else {
        return -1;
      }
    });

    const merkleInfo: { [key: string]: string } = {};
    snapshotInfos.forEach((s) => {
      merkleInfo[s.merkleRoot] = s.snapshotUri;
    });
    const metadata = await this.metadata.get();
    const encoded = [];

    // upload new merkle roots to snapshot URIs if updated
    if (!deepEqual(metadata.merkle, merkleInfo)) {
      const mergedMetadata = this.metadata.parseInputMetadata({
        ...metadata,
        merkle: merkleInfo,
      });
      // using internal method to just upload, avoids one contract call
      const contractURI = await this.metadata._parseAndUploadMetadata(
        mergedMetadata,
      );
      encoded.push(
        this.contractWrapper.readContract.interface.encodeFunctionData(
          "setContractURI",
          [contractURI],
        ),
      );
    }

    encoded.push(
      this.contractWrapper.readContract.interface.encodeFunctionData(
        "setClaimConditions",
        [sortedConditions, resetClaimEligibilityForAll],
      ),
    );

    return {
      receipt: await this.contractWrapper.sendTransaction("multicall", [
        encoded,
      ]),
    };
  }

  /**
   * Update a single claim condition with new data.
   *
   * @param index the index of the claim condition to update, as given by the index from the result of `getAll()`
   * @param claimConditionInput the new data to update, previous data will be retained
   */
  public async update(
    index: number,
    claimConditionInput: ClaimConditionInput,
  ): Promise<TransactionResult> {
    const existingConditions = await this.getAll();
    if (index >= existingConditions.length) {
      throw Error(
        `Index out of bounds - got index: ${index} with ${existingConditions.length} conditions`,
      );
    }
    const mergedCondition = ClaimConditionOutputSchema.parse({
      ...existingConditions[index],
      ...claimConditionInput,
    });

    const newConditions: ClaimConditionInput[] = existingConditions.map(
      (existing) => ({
        ...existing,
        price: existing.price.toString(),
      }),
    );

    newConditions[index] = {
      ...mergedCondition,
      price: mergedCondition.price.toString(),
    };
    return await this.set(newConditions);
  }

  /** ***************************************
   * PRIVATE FUNCTIONS
   *****************************************/

  private async transformResultToClaimCondition(
    pm: IDropERC721.ClaimConditionStructOutput,
  ): Promise<ClaimCondition> {
    const cv = await fetchCurrencyValue(
      this.contractWrapper.getProvider(),
      pm.currency,
      pm.pricePerToken,
    );
    return ClaimConditionOutputSchema.parse({
      startTime: new Date(BigNumber.from(pm.startTimestamp).toNumber() * 1000),
      maxQuantity: pm.maxClaimableSupply.toString(),
      currentMintSupply: pm.supplyClaimed.toString(),
      availableSupply: BigNumber.from(pm.maxClaimableSupply)
        .sub(pm.supplyClaimed)
        .toString(),
      quantityLimitPerTransaction: pm.quantityLimitPerTransaction.toString(),
      waitInSeconds: pm.waitTimeInSecondsBetweenClaims.toString(),
      price: BigNumber.from(pm.pricePerToken),
      currency: pm.currency,
      currencyAddress: pm.currency,
      currencyMetadata: cv,
      merkleRootHash: pm.merkleRoot,
    });
  }

  private async convertToContractModel(
    c: FilledConditionInput,
  ): Promise<IDropERC721.ClaimConditionStruct> {
    const currency =
      c.currencyAddress === AddressZero
        ? NATIVE_TOKEN_ADDRESS
        : c.currencyAddress;
    return {
      startTimestamp: BigNumber.from(c.startTime),
      maxClaimableSupply: c.maxQuantity,
      supplyClaimed: 0,
      quantityLimitPerTransaction: c.quantityLimitPerTransaction,
      waitTimeInSecondsBetweenClaims: c.waitInSeconds,
      pricePerToken: await normalizePriceValue(
        this.contractWrapper.getProvider(),
        c.price,
        currency,
      ),
      currency,
      merkleRoot: c.merkleRootHash,
    };
  }

  /**
   * Fetches the proof for the current signer for a particular wallet.
   *
   * @param merkleRoot - The merkle root of the condition to check.
   * @returns - The proof for the current signer for the specified condition.
   */
  private async getClaimerProofs(
    merkleRoot: string,
    addressToClaim?: string,
  ): Promise<string[]> {
    if (!addressToClaim) {
      addressToClaim = await this.contractWrapper.getSignerAddress();
    }
    const metadata = await this.metadata.get();
    const snapshotUri = metadata.merkle[merkleRoot];
    const snapshot = await this.storage.get(snapshotUri);
    const snapshotData = SnapshotSchema.parse(snapshot);
    const item = snapshotData.claims.find(
      (c) => c.address.toLowerCase() === addressToClaim?.toLowerCase(),
    );

    if (item === undefined) {
      return [];
    }
    return item.proof;
  }
}
