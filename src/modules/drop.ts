import {
  ERC20__factory,
  ILazyMintERC721,
  LazyMintERC721,
  LazyMintERC721__factory,
} from "@3rdweb/contracts";
import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish, BytesLike, ethers } from "ethers";
import {
  getCurrencyValue,
  isNativeToken,
  ModuleType,
  NATIVE_TOKEN_ADDRESS,
  Role,
  RolesMap,
} from "../common";
import { invariant } from "../common/invariant";
import { isMetadataEqual } from "../common/isMetadataEqual";
import { getTokenMetadata, NFTMetadata, NFTMetadataOwner } from "../common/nft";
import type { ThirdwebSDK } from "../core";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject, ProviderOrSigner } from "../core/types";
import { ClaimEligibility } from "../enums";
import ClaimConditionFactory from "../factories/ClaimConditionFactory";
import { ITransferable } from "../interfaces/contracts/ITransferable";
import { ISDKOptions } from "../interfaces/ISdkOptions";
import { NFTDropModuleMetadata } from "../schema";
import { ClaimCondition } from "../types/claim-conditions/PublicClaimCondition";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../types/QueryParams";
import { Snapshot } from "../types/snapshots/Snapshot";

/**
 * Setup a collection of one-of-one NFTs that are minted as users claim them.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const module = sdk.getDropModule("{{module_address}}");
 * ```
 *
 * @public
 */
export class DropModule
  extends ModuleWithRoles<LazyMintERC721, NFTDropModuleMetadata>
  implements ITransferable
{
  public static moduleType: ModuleType = "NFT_DROP" as const;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.transfer,
  ] as const;

  /**
   * @internal
   */
  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    options: ISDKOptions,
    sdk: ThirdwebSDK,
  ) {
    super(providerOrSigner, address, options, sdk);
  }

  /**
   * @internal
   */
  public setProviderOrSigner(providerOrSigner: ProviderOrSigner) {
    super.setProviderOrSigner(providerOrSigner);
  }

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return DropModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): LazyMintERC721 {
    return LazyMintERC721__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return DropModule.moduleType;
  }

  private async getTokenMetadata(tokenId: string): Promise<NFTMetadata> {
    return await getTokenMetadata(
      this.readOnlyContract,
      tokenId,
      this.ipfsGatewayUrl,
    );
  }

  public async get(tokenId: string): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId).catch(() => AddressZero),
      this.getTokenMetadata(tokenId),
    ]);

    return { owner, metadata };
  }

  /**
   * Get All NFTs
   *
   * @remarks Get all the data associated with every NFT in this module.
   *
   * @example
   * ```javascript
   * const nfts = await module.getAll();
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the module.
   */
  public async getAll(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = Math.min(
      (await this.readOnlyContract.nextTokenIdToMint()).toNumber(),
      start + count,
    );
    return await Promise.all(
      Array.from(Array(maxId - start).keys()).map((i) =>
        this.get((start + i).toString()),
      ),
    );
  }

  public async getAllUnclaimed(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = BigNumber.from(
      Math.min(
        (await this.readOnlyContract.nextTokenIdToMint()).toNumber(),
        start + count,
      ),
    );
    const unmintedId = await this.readOnlyContract.nextTokenIdToClaim();
    return (
      await Promise.all(
        Array.from(Array(maxId.sub(unmintedId).toNumber()).keys()).map((i) =>
          this.getTokenMetadata(unmintedId.add(i).toString()),
        ),
      )
    ).map((metadata) => ({ owner: AddressZero, metadata }));
  }

  public async getAllClaimed(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = Math.min(
      (await this.readOnlyContract.nextTokenIdToClaim()).toNumber(),
      start + count,
    );
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async ownerOf(tokenId: string): Promise<string> {
    return await this.readOnlyContract.ownerOf(tokenId);
  }

  public async getPrimarySaleRecipient(): Promise<string> {
    return await this.readOnlyContract.primarySaleRecipient();
  }

  public async setPrimarySaleRecipient(
    recipient: string,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setDefaultSaleRecipient", [recipient]);
  }

  /**
   * Get Owned NFTs
   *
   * @remarks Get all the data associated with the NFTs owned by a specific wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet to get the NFTs of
   * const address = "{{wallet_address}}";
   * const nfts = await module.getOwned(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the module.
   */
  public async getOwned(_address?: string): Promise<NFTMetadataOwner[]> {
    const address = _address ? _address : await this.getSignerAddress();
    const balance = await this.readOnlyContract.balanceOf(address);
    const indices = Array.from(Array(balance.toNumber()).keys());
    const tokenIds = await Promise.all(
      indices.map((i) => this.readOnlyContract.tokenOfOwnerByIndex(address, i)),
    );
    return await Promise.all(
      tokenIds.map((tokenId) => this.get(tokenId.toString())),
    );
  }
  private async transformResultToClaimCondition(
    pm: ILazyMintERC721.ClaimConditionStructOutput,
  ): Promise<ClaimCondition> {
    const cv = await getCurrencyValue(
      this.providerOrSigner,
      pm.currency,
      pm.pricePerToken,
    );
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

  public async getActiveClaimCondition(): Promise<ClaimCondition> {
    const index = await this.readOnlyContract.getIndexOfActiveCondition();
    const mc = await this.readOnlyContract.getClaimConditionAtIndex(index);
    return await this.transformResultToClaimCondition(mc);
  }
  public async getAllClaimConditions(): Promise<ClaimCondition[]> {
    const claimCondition = await this.readOnlyContract.claimConditions();
    const count = claimCondition.totalConditionCount.toNumber();
    const conditions = [];
    for (let i = 0; i < count; i++) {
      conditions.push(await this.readOnlyContract.getClaimConditionAtIndex(i));
    }
    return Promise.all(
      conditions.map((c) => this.transformResultToClaimCondition(c)),
    );
  }

  public async totalSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.nextTokenIdToMint();
  }

  /**
   * @internal
   */
  public async maxTotalSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.nextTokenIdToMint();
  }

  public async totalUnclaimedSupply(): Promise<BigNumber> {
    return (await this.readOnlyContract.nextTokenIdToMint()).sub(
      await this.totalClaimedSupply(),
    );
  }

  public async totalClaimedSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.nextTokenIdToClaim();
  }

  /**
   * Get NFT Balance
   *
   * @remarks Get a wallets NFT balance (number of NFTs in this module owned by the wallet).
   *
   * @example
   * ```javascript
   * // Address of the wallet to check NFT balance
   * const address = "{{wallet_address}}";
   *
   * const balance = await module.balanceOf(address);
   * console.log(balance);
   * ```
   */
  public async balanceOf(address: string): Promise<BigNumber> {
    return await this.readOnlyContract.balanceOf(address);
  }

  public async balance(): Promise<BigNumber> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.readOnlyContract.isApprovedForAll(address, operator);
  }

  // write functions
  public async setApproval(
    operator: string,
    approved = true,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setApprovalForAll", [
      operator,
      approved,
    ]);
  }

  /**
   * Transfer NFT
   *
   * @remarks Transfer an NFT from the connected wallet to another wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to send the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // The token ID of the NFT you want to send
   * const tokenId = "0";
   *
   * await module.transfer(toAddress, tokenId);
   * ```
   */
  public async transfer(
    to: string,
    tokenId: string,
  ): Promise<TransactionReceipt> {
    const from = await this.getSignerAddress();
    return await this.sendTransaction(
      "safeTransferFrom(address,address,uint256)",
      [from, to, tokenId],
    );
  }

  /**
   * Sets public mint conditions for the next minting using the
   * claim condition factory.
   *
   * @param factory - The claim condition factory.
   */
  public async setClaimConditions(factory: ClaimConditionFactory) {
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
    const { metadata } = await this.getModuleMetadata(false);
    invariant(metadata, "Metadata is not set, this should never happen");
    const oldMerkle = metadata["merkle"];
    if (factory.allSnapshots().length === 0 && "merkle" in metadata) {
      metadata["merkle"] = {};
    } else {
      metadata["merkle"] = merkleInfo;
    }

    const encoded = [];
    if (!isMetadataEqual(oldMerkle, metadata["merkle"])) {
      const metadataUri = await this.sdk
        .getStorage()
        .upload(JSON.stringify(metadata));
      encoded.push(
        this.contract.interface.encodeFunctionData("setContractURI", [
          metadataUri,
        ]),
      );
    }
    encoded.push(
      this.contract.interface.encodeFunctionData("setClaimConditions", [
        conditions,
        true,
      ]),
    );

    return await this.sendTransaction("multicall", [encoded]);
  }

  public async updateClaimConditions(factory: ClaimConditionFactory) {
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
    const encoded = [];
    const { metadata } = await this.getModuleMetadata(false);
    invariant(metadata, "Metadata is not set, this should never happen");
    const oldMerkle = metadata["merkle"];

    if (factory.allSnapshots().length === 0 && "merkle" in metadata) {
      metadata["merkle"] = {};
    } else {
      metadata["merkle"] = merkleInfo;
    }

    if (!isMetadataEqual(oldMerkle, metadata["merkle"])) {
      const metadataUri = await this.sdk
        .getStorage()
        .upload(JSON.stringify(metadata));
      encoded.push(
        this.contract.interface.encodeFunctionData("setContractURI", [
          metadataUri,
        ]),
      );
    }

    encoded.push(
      this.contract.interface.encodeFunctionData("setClaimConditions", [
        conditions,
        false,
      ]),
    );
    return await this.sendTransaction("multicall", [encoded]);
  }
  /**
   * Creates a claim condition factory
   *
   * @returns - A new claim condition factory
   */
  public getClaimConditionsFactory(): ClaimConditionFactory {
    const createSnapshotFunc = this.sdk.createSnapshot.bind(this.sdk);
    const factory = new ClaimConditionFactory(createSnapshotFunc);
    return factory;
  }

  /**
   * For any claim conditions that a particular wallet is violating,
   * this function returns human readable information about the
   * breaks in the condition that can be used to inform the user.
   *
   * @param quantity - The desired quantity that would be claimed.
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
        this.readOnlyContract.getIndexOfActiveCondition(),
        this.getActiveClaimCondition(),
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
      await this.readOnlyContract.getTimestampForNextValidClaim(
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
        const balance = await this.readOnlyContract.balanceOf(addressToCheck);
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
      if (isNativeToken(claimCondition.currency)) {
        const provider = await this.getProvider();
        const balance = await provider.getBalance(addressToCheck);
        if (balance.lt(totalPrice)) {
          reasons.push(ClaimEligibility.NotEnoughTokens);
        }
      } else {
        const provider = await this.getProvider();
        const balance = await ERC20__factory.connect(
          claimCondition.currency,
          provider,
        ).balanceOf(addressToCheck);
        if (balance.lt(totalPrice)) {
          reasons.push(ClaimEligibility.NotEnoughTokens);
        }
      }
    }

    return reasons;
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
      addressToCheck = await this.getSignerAddress();
    }

    return (
      (await this.getClaimIneligibilityReasons(quantity, addressToCheck))
        .length === 0
    );
  }

  /**
   * Returns proofs and the overrides required for the transaction.
   *
   * @returns - `overrides` and `proofs` as an object.
   */

  private async prepareClaim(
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
    _addressToClaim?: string,
  ): Promise<{
    overrides: ethers.CallOverrides;
    proofs: BytesLike[];
  }> {
    const mintCondition = await this.getActiveClaimCondition();
    const { metadata } = await this.getModuleMetadata();

    const addressToClaim = _addressToClaim || (await this.getSignerAddress());

    if (
      !mintCondition.merkleRoot.toString().startsWith(AddressZero) &&
      metadata?.merkle
    ) {
      const snapshot = await this.sdk
        .getStorage()
        .get(metadata.merkle[mintCondition.merkleRoot.toString()]);

      const snapshotData = this.jsonConvert.deserializeObject(
        JSON.parse(snapshot),
        Snapshot,
      );
      const item = snapshotData.claims.find(
        (c) => c.address.toLowerCase() === addressToClaim.toLowerCase(),
      );
      if (item === undefined) {
        throw new Error("No claim found for this address");
      }
      proofs = item.proof;
    }

    const overrides = (await this.getCallOverrides()) || {};
    if (mintCondition.pricePerToken.gt(0)) {
      if (isNativeToken(mintCondition.currency)) {
        overrides["value"] = BigNumber.from(mintCondition.pricePerToken).mul(
          quantity,
        );
      } else {
        const erc20 = ERC20__factory.connect(
          mintCondition.currency,
          this.providerOrSigner,
        );
        const owner = await this.getSignerAddress();
        const spender = this.address;
        const allowance = await erc20.allowance(owner, spender);
        const totalPrice = BigNumber.from(mintCondition.pricePerToken).mul(
          BigNumber.from(quantity),
        );

        if (allowance.lt(totalPrice)) {
          await this.sendContractTransaction(erc20, "approve", [
            spender,
            allowance.add(totalPrice),
          ]);
        }
      }
    }
    return {
      overrides,
      proofs,
    };
  }

  /**
   * Claim NFTs to Wallet
   *
   * @remarks Let the a specified wallet claim NFTs.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to claim the NFTs
   * const address = "{{wallet_address}}";
   *
   * // The number of NFTs to claim
   * const quantity = 1;
   *
   * await module.claimTo(quantity, address);
   * ```
   *
   * @param quantity - Quantity of the tokens you want to claim
   * @param addressToClaim - Address you want to send the token to
   * @param proofs - Array of proofs
   *
   * @returns - Receipt for the transaction
   */
  public async claimTo(
    quantity: BigNumberish,
    addressToClaim: string,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionReceipt> {
    const claimData = await this.prepareClaim(quantity, proofs, addressToClaim);

    return await this.sendTransaction(
      "claim",
      [addressToClaim, quantity, claimData.proofs],
      claimData.overrides,
    );
  }

  /** Claim NFTs
   *
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - Receipt for the transaction
   */
  public async claim(
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<NFTMetadataOwner[]> {
    const claimData = await this.prepareClaim(quantity, proofs);
    const receipt = await this.sendTransaction(
      "claim",
      [await this.getSignerAddress(), quantity, claimData.proofs],
      claimData.overrides,
    );
    const event = this.parseEventLogs("ClaimedTokens", receipt?.logs);
    const startingIndex: BigNumber = event.startTokenId;
    const endingIndex = startingIndex.add(quantity);
    const tokenIds = [];
    for (let i = startingIndex; i.lt(endingIndex); i = i.add(1)) {
      tokenIds.push(BigNumber.from(i.toString()));
    }
    return await Promise.all(
      tokenIds.map(async (t) => await this.get(t.toString())),
    );
  }

  public async burn(tokenId: BigNumberish): Promise<TransactionReceipt> {
    return await this.sendTransaction("burn", [tokenId]);
  }

  public async transferFrom(
    from: string,
    to: string,
    tokenId: BigNumberish,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("transferFrom", [from, to, tokenId]);
  }

  /**
   * Create batch allows you to create a batch of tokens
   * in one transaction. This function can only be called
   * once per module at the moment.
   *
   * @beta
   *
   * @param metadatas - The metadata to include in the batch.
   */
  public async createBatch(
    metadatas: MetadataURIOrObject[],
  ): Promise<string[]> {
    const startFileNumber = await this.readOnlyContract.nextTokenIdToMint();
    const { baseUri } = await this.sdk
      .getStorage()
      .uploadMetadataBatch(metadatas, this.address, startFileNumber.toNumber());
    const receipt = await this.sendTransaction("lazyMint", [
      metadatas.length,
      baseUri,
    ]);
    const event = this.parseEventLogs("LazyMintedTokens", receipt?.logs);
    const [startingIndex, endingIndex]: BigNumber[] = event;
    const tokenIds = [];
    for (let i = startingIndex; i.lte(endingIndex); i = i.add(1)) {
      tokenIds.push(i.toString());
    }
    return tokenIds;
  }

  /**
   * @internal
   *
   * @returns - True if the batch has been created, false otherwise.
   */
  public async canCreateBatch(): Promise<boolean> {
    return true;
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
      addressToClaim = await this.getSignerAddress();
    }
    const { metadata } = await this.getModuleMetadata();
    if (!metadata?.merkle) {
      return [];
    }
    const snapshot = await this.sdk
      .getStorage()
      .get(metadata.merkle[merkleRoot]);

    const snapshotData = this.jsonConvert.deserializeObject(
      JSON.parse(snapshot),
      Snapshot,
    );
    const item = snapshotData.claims.find(
      (c) => c.address.toLowerCase() === addressToClaim?.toLowerCase(),
    );

    if (item === undefined) {
      return [];
    }
    return item.proof;
  }

  public async isTransferRestricted(): Promise<boolean> {
    return this.readOnlyContract.transfersRestricted();
  }

  public async setRestrictedTransfer(
    restricted = false,
  ): Promise<TransactionReceipt> {
    await this.onlyRoles(["admin"], await this.getSignerAddress());
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }
}
