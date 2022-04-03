import { IStorage } from "../interfaces/IStorage";
import { DropErc721ContractSchema } from "../../schema/contracts/drop-erc721";
import { ContractMetadata } from "./contract-metadata";
import { DropERC1155, IERC20, IERC20__factory } from "@thirdweb-dev/contracts";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { isNativeToken } from "../../common/currency";
import { ContractWrapper } from "./contract-wrapper";
import { ClaimCondition, ClaimConditionInput } from "../../types";
import deepEqual from "deep-equal";
import { ClaimEligibility } from "../../enums";
import { TransactionResult } from "../index";
import {
  getClaimerProofs,
  processClaimConditionInputs,
  transformResultToClaimCondition,
  updateExistingClaimConditions,
} from "../../common/claim-conditions";
import { MaxUint256 } from "@ethersproject/constants";
import { isBrowser } from "../../common/utils";
import { includesErrorMessage } from "../../common";

/**
 * Manages claim conditions for Edition Drop contracts
 * @public
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
    const id =
      await this.contractWrapper.readContract.getActiveClaimConditionId(
        tokenId,
      );
    const mc = await this.contractWrapper.readContract.getClaimConditionById(
      tokenId,
      id,
    );
    const metadata = await this.metadata.get();
    return await transformResultToClaimCondition(
      mc,
      this.contractWrapper.getProvider(),
      metadata.merkle,
      this.storage,
    );
  }

  /**
   * Get all the claim conditions
   *
   * @returns the claim conditions metadata
   */
  public async getAll(tokenId: BigNumberish): Promise<ClaimCondition[]> {
    const claimCondition =
      await this.contractWrapper.readContract.claimCondition(tokenId);
    const startId = claimCondition.currentStartId.toNumber();
    const count = claimCondition.count.toNumber();
    const conditions = [];
    for (let i = startId; i < startId + count; i++) {
      conditions.push(
        await this.contractWrapper.readContract.getClaimConditionById(
          tokenId,
          i,
        ),
      );
    }
    const metadata = await this.metadata.get();
    return Promise.all(
      conditions.map((c) =>
        transformResultToClaimCondition(
          c,
          this.contractWrapper.getProvider(),
          metadata.merkle,
          this.storage,
        ),
      ),
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
    // TODO switch to use verifyClaim
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
   * this function returns human-readable information about the
   * breaks in the condition that can be used to inform the user.
   *
   * @param tokenId - the token id to check
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
      addressToCheck = await this.contractWrapper.getSignerAddress();
    }

    try {
      [activeConditionIndex, claimCondition] = await Promise.all([
        this.contractWrapper.readContract.getActiveClaimConditionId(tokenId),
        this.getActive(tokenId),
      ]);
    } catch (err: any) {
      if (includesErrorMessage(err, "no public mint condition.")) {
        reasons.push(ClaimEligibility.NoClaimConditionSet);
        return reasons;
      }
      if (includesErrorMessage(err, "no active mint condition.")) {
        reasons.push(ClaimEligibility.NoActiveClaimPhase);
        return reasons;
      }
      reasons.push(ClaimEligibility.Unknown);
      return reasons;
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
      const metadata = await this.metadata.get();
      const proofs = await getClaimerProofs(
        addressToCheck,
        merkleLower,
        0,
        metadata.merkle,
        this.storage,
      );
      try {
        const [validMerkleProof] =
          await this.contractWrapper.readContract.verifyClaimMerkleProof(
            activeConditionIndex,
            addressToCheck,
            tokenId,
            quantity,
            proofs.proof,
            proofs.maxClaimable,
          );
        if (!validMerkleProof) {
          reasons.push(ClaimEligibility.AddressNotAllowed);
          return reasons;
        }
      } catch (e) {
        reasons.push(ClaimEligibility.AddressNotAllowed);
        return reasons;
      }
    }

    // check for claim timestamp between claims
    const [lastClaimedTimestamp, timestampForNextClaim] =
      await this.contractWrapper.readContract.getClaimTimestamp(
        tokenId,
        activeConditionIndex,
        addressToCheck,
      );

    const now = BigNumber.from(Date.now()).div(1000);

    if (lastClaimedTimestamp.gt(0) && now.lt(timestampForNextClaim)) {
      // contract will return MaxUint256 if user has already claimed and cannot claim again
      if (timestampForNextClaim.eq(MaxUint256)) {
        reasons.push(ClaimEligibility.AlreadyClaimed);
      } else {
        reasons.push(ClaimEligibility.WaitBeforeNextClaimTransaction);
      }
    }

    // if not within a browser conetext, check for wallet balance.
    // In browser context, let the wallet do that job
    if (claimCondition.price.gt(0) && !isBrowser()) {
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
   * const publicSaleStartTime = new Date(Date.now() + 60 * 60 * 24 * 1000);
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
    const { snapshotInfos, sortedConditions } =
      await processClaimConditionInputs(
        claimConditionInputs,
        0,
        this.contractWrapper.getProvider(),
        this.storage,
      );

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
   * @param tokenId - the token id to update
   * @param index - the index of the claim condition to update, as given by the index from the result of `getAll()`
   * @param claimConditionInput - the new data to update, previous data will be retained
   */
  public async update(
    tokenId: BigNumberish,
    index: number,
    claimConditionInput: ClaimConditionInput,
  ): Promise<TransactionResult> {
    const existingConditions = await this.getAll(tokenId);
    const newConditionInputs = await updateExistingClaimConditions(
      index,
      claimConditionInput,
      existingConditions,
      0,
    );
    return await this.set(tokenId, newConditionInputs);
  }
}
