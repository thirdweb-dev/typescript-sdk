import { IStorage } from "../interfaces/IStorage";
import { SnapshotSchema } from "../../schema/contracts/common/snapshots";
import { DropErc721ContractSchema } from "../../schema/contracts/drop-erc721";
import { ContractMetadata } from "./contract-metadata";
import {
  DropERC1155,
  IDropERC1155,
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
  ClaimConditionInputArray,
  ClaimConditionOutputSchema,
} from "../../schema/contracts/common/claim-conditions";
import { TransactionResult } from "../index";
import { NATIVE_TOKEN_ADDRESS } from "../../constants/currency";
import { updateExsitingClaimConditions } from "../../common/claim-conditions";

/**
 * Manages claim conditions for Bundle Drop contracts
 */
export class DropErc1155ClaimConditions {
  private contractWrapper;
  private metadata;
  private storage: IStorage;

  constructor(
    contractWrapper: ContractWrapper<DropERC1155>,
    metadata: ContractMetadata<DropERC1155, typeof DropErc721ContractSchema>,
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
  public async getActive(tokenId: BigNumberish): Promise<ClaimCondition> {
    const index =
      await this.contractWrapper.readContract.getIndexOfActiveCondition(
        tokenId,
      );
    const mc = await this.contractWrapper.readContract.getClaimConditionAtIndex(
      tokenId,
      index,
    );
    return await this.transformResultToClaimCondition(mc);
  }

  /**
   * Get all the claim conditions
   *
   * @returns the claim conditions metadata
   */
  public async getAll(tokenId: BigNumberish): Promise<ClaimCondition[]> {
    const claimCondition =
      await this.contractWrapper.readContract.claimConditions(tokenId);
    const count = claimCondition.totalConditionCount.toNumber();
    const conditions = [];
    for (let i = 0; i < count; i++) {
      conditions.push(
        await this.contractWrapper.readContract.getClaimConditionAtIndex(
          tokenId,
          i,
        ),
      );
    }
    return Promise.all(
      conditions.map((c) => this.transformResultToClaimCondition(c)),
    );
  }

  /**
   * Can Claim
   *
   * @remarks Check if a particular NFT can currently be claimed by a given user.
   *
   * @example
   * ```javascript
   * // Quantity of tokens to check claimability of
   * const quantity = 1;
   * const canClaim = await contract.canClaim(quantity);
   * ```
   */
  public async canClaim(
    tokenId: BigNumberish,
    quantity: BigNumberish,
    addressToCheck?: string,
  ): Promise<boolean> {
    if (addressToCheck === undefined) {
      addressToCheck = await this.contractWrapper.getSignerAddress();
    }
    return (
      (
        await this.getClaimIneligibilityReasons(
          tokenId,
          quantity,
          addressToCheck,
        )
      ).length === 0
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
    tokenId: BigNumberish,
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
        this.contractWrapper.readContract.getIndexOfActiveCondition(tokenId),
        this.getActive(tokenId),
      ]);
    } catch (err: any) {
      if ((err.message as string).includes("no active mint condition.")) {
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
        tokenId,
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
          tokenId,
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
   * Set public mint conditions on a NFT
   *
   * @remarks Sets the public mint conditions that need to be fulfilled by users to claim a particular NFT in this bundle.
   *
   * @example
   * ```javascript
   * const presaleStartTime = new Date();
   * const publicSaleStartTime = new Date(Date.now() + 24_HOURS);
   * const claimConditions = [
   *   {
   *     startTime: presaleStartTime, // start the presale now
   *     maxQuantity: 2, // limit how many mints for this presale
   *     price: 0.01, // presale price
   *     snapshot: ['0x...', '0x...'], // limit minting to only certain addresses
   *   },
   *   {
   *     startTime: publicSaleStartTime, // 24h after presale, start public sale
   *     price: 0.08, // public sale price
   *   }
   * ]);
   *
   * const tokenId = 0; // the id of the NFT to set claim conditions on
   * await dropContract.claimConditions.set(tokenId, claimConditions);
   * ```
   *
   * @param tokenId - The id of the NFT to set the claim conditions on
   * @param claimConditionInputs - The claim conditions
   * @param resetClaimEligibilityForAll - Whether to reset the state of who already claimed NFTs previously
   */
  public async set(
    tokenId: BigNumberish,
    claimConditionInputs: ClaimConditionInput[],
    resetClaimEligibilityForAll = false,
  ): Promise<TransactionResult> {
    // process inputs
    const snapshotInfos: SnapshotInfo[] = [];
    const inputsWithSnapshots = await Promise.all(
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
        return conditionInput;
      }),
    );

    const parsedInputs = ClaimConditionInputArray.parse(inputsWithSnapshots);

    // Convert processed inputs to the format the contract expects, and sort by timestamp
    const sortedConditions: IDropERC1155.ClaimConditionStruct[] = (
      await Promise.all(parsedInputs.map((c) => this.convertToContractModel(c)))
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

    // keep the old merkle roots from other tokenIds
    for (const key of Object.keys(metadata.merkle)) {
      merkleInfo[key] = metadata.merkle[key];
    }

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
        [tokenId, sortedConditions, resetClaimEligibilityForAll],
      ),
    );

    return {
      receipt: await this.contractWrapper.multiCall(encoded),
    };
  }

  /**
   * Update a single claim condition with new data.
   * @param index the index of the claim condition to update, as given by the index from the result of `getAll()`
   * @param claimConditionInput the new data to update, previous data will be retained
   */
  public async update(
    tokenId: BigNumberish,
    index: number,
    claimConditionInput: ClaimConditionInput,
  ): Promise<TransactionResult> {
    const existingConditions = await this.getAll(tokenId);
    const newConditionInputs = updateExsitingClaimConditions(
      index,
      claimConditionInput,
      existingConditions,
    );
    return await this.set(tokenId, newConditionInputs);
  }

  /** ***************************************
   * PRIVATE FUNCTIONS
   *****************************************/

  private async transformResultToClaimCondition(
    pm: IDropERC1155.ClaimConditionStructOutput,
  ): Promise<ClaimCondition> {
    const cv = await fetchCurrencyValue(
      this.contractWrapper.getProvider(),
      pm.currency,
      pm.pricePerToken,
    );
    return ClaimConditionOutputSchema.parse({
      startTime: pm.startTimestamp,
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
  ): Promise<IDropERC1155.ClaimConditionStruct> {
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
