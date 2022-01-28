import { DropErc721ModuleSchema } from "../schema/modules/drop-erc721";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { DropERC721, IDropERC721 } from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../common/currency";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { ClaimCondition } from "../types";
import ClaimConditionFactory from "../factories/claim-condition-factory";
import isEqual from "lodash.isequal";

export class DropERC721ClaimConditions {
  private contractWrapper;
  private metadata;

  constructor(
    contractWrapper: ContractWrapper<DropERC721>,
    metadata: ContractMetadata<DropERC721, typeof DropErc721ModuleSchema>,
  ) {
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

  /** ***************************************
   * WRITE FUNCTIONS
   *****************************************/

  /**
   * Sets public mint conditions for the next minting using the
   * claim condition factory.
   *
   * @param factory - The claim condition factory.
   * @param resetPreviousClaims - Whether to reset the state of who already claimed NFTs previously
   */
  public async set(
    factory: ClaimConditionFactory,
    resetClaimEligibilityForAll: boolean,
  ) {
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

    if (!isEqual(metadata.merkle, merkleInfo)) {
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
}
