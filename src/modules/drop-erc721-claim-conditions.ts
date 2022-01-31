import { IStorage } from "../core/interfaces/IStorage";
import { SnapshotSchema } from "../schema/modules/common/snapshots";
import { DropErc721ModuleSchema } from "../schema/modules/drop-erc721";
import { ContractMetadata } from "../core/classes/contract-metadata";
import {
  DropERC721,
  IDropERC721,
  IERC20,
  IERC20__factory,
} from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { isNativeToken, NATIVE_TOKEN_ADDRESS } from "../common/currency";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { ClaimCondition, PublicClaimCondition } from "../types";
import deepEqual from "deep-equal";
import { ClaimEligibility } from "../enums";
import ClaimConditionFactory from "../factories/claim-condition-factory";
import ClaimConditionPhase from "../factories/claim-condition-phase";

export class DropERC721ClaimConditions {
  private contractWrapper;
  private metadata;
  private storage: IStorage;

  constructor(
    contractWrapper: ContractWrapper<DropERC721>,
    metadata: ContractMetadata<DropERC721, typeof DropErc721ModuleSchema>,
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
   * // Quantity of tokens to check if they are claimable
   * const quantity = 1;
   *
   * await module.canClaim(quantity);
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
    const merkleRootArray = ethers.utils.stripZeros(claimCondition.merkleRoot);
    if (merkleRootArray.length > 0) {
      const merkleLower = claimCondition.merkleRoot.toString();
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
        BigNumber.from(claimCondition.waitTimeSecondsLimitPerTransaction).eq(
          timestampForNextClaim,
        )
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
    if (claimCondition.pricePerToken.gt(0)) {
      const totalPrice = claimCondition.pricePerToken.mul(quantity);
      const provider = this.contractWrapper.getProvider();
      if (isNativeToken(claimCondition.currency)) {
        const balance = await provider.getBalance(addressToCheck);
        if (balance.lt(totalPrice)) {
          reasons.push(ClaimEligibility.NotEnoughTokens);
        }
      } else {
        const erc20 = new ContractWrapper<IERC20>(
          provider,
          claimCondition.currency,
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

  /**
   * Creates a claim condition factory
   *
   * @returns - A new claim condition factory
   */
  public builder(): ClaimConditionFactory {
    return new ClaimConditionFactory(this.storage);
  }

  /** ***************************************
   * WRITE FUNCTIONS
   *****************************************/

  /**
   * Sets public mint conditions for the next minting using the
   * claim condition factory.
   *
   * @param factory - The claim condition factory.
   * @param resetClaimEligibilityForAll - Whether to reset the state of who already claimed NFTs previously
   */
  public async set(
    claimConditions: PublicClaimCondition[],
    resetClaimEligibilityForAll: boolean,
  ) {
    const factory: ClaimConditionFactory = new ClaimConditionFactory(
      this.storage,
    );
    factory.fromPublicClaimConditions(claimConditions);
    const conditions = (await factory.buildConditions()).map((c) => ({
      startTimestamp: c.startTimestamp,
      maxClaimableSupply: c.maxMintSupply,
      supplyClaimed: 0,
      quantityLimitPerTransaction: c.quantityLimitPerTransaction,
      waitTimeInSecondsBetweenClaims: c.waitTimeSecondsLimitPerTransaction,
      pricePerToken: c.pricePerToken,
      currency: c.currency === AddressZero ? NATIVE_TOKEN_ADDRESS : c.currency,
      merkleRoot: c.merkleRoot,
    }));

    const merkleInfo: { [key: string]: string } = {};
    factory.allSnapshots().forEach((s) => {
      merkleInfo[s.merkleRoot] = s.snapshotUri;
    });
    const metadata = await this.metadata.get();
    const encoded = [];

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
        [conditions, resetClaimEligibilityForAll],
      ),
    );

    return await this.contractWrapper.sendTransaction("multicall", [encoded]);
  }

  /** ***************************************
   * PRIVATE FUNCTIONS
   *****************************************/

  private async transformResultToClaimCondition(
    pm: IDropERC721.ClaimConditionStructOutput,
  ): Promise<ClaimCondition> {
    // TODO have a dedicated class for currency manipulation that takes in a contractWrapper?
    // const cv = await getCurrencyValue(
    //   this.providerOrSigner,
    //   pm.currency,
    //   pm.pricePerToken,
    // );
    const cv = "";
    return {
      startTimestamp: new Date(
        BigNumber.from(pm.startTimestamp).toNumber() * 1000,
      ),
      maxMintSupply: pm.maxClaimableSupply.toString(),
      currentMintSupply: pm.supplyClaimed.toString(),
      availableSupply: BigNumber.from(pm.maxClaimableSupply)
        .sub(pm.supplyClaimed)
        .toString(),
      quantityLimitPerTransaction: pm.quantityLimitPerTransaction.toString(),
      waitTimeSecondsLimitPerTransaction:
        pm.waitTimeInSecondsBetweenClaims.toString(),
      price: BigNumber.from(pm.pricePerToken),
      pricePerToken: BigNumber.from(pm.pricePerToken),
      currency: pm.currency,
      currencyContract: pm.currency,
      currencyMetadata: cv,
      merkleRoot: pm.merkleRoot,
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
    const snapshotData = SnapshotSchema.parse(JSON.parse(snapshot));
    const item = snapshotData.claims.find(
      (c) => c.address.toLowerCase() === addressToClaim?.toLowerCase(),
    );

    if (item === undefined) {
      return [];
    }
    return item.proof;
  }
}
