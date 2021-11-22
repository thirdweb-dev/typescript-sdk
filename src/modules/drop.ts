import {
  LazyNFT as Drop,
  LazyNFT__factory as Drop__factory,
} from "@3rdweb/contracts";
import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getTokenMetadata, NFTMetadata, NFTMetadataOwner } from "../common/nft";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 * @beta
 */
export interface CreatePublicMintCondition {
  startTimestampInSeconds?: BigNumberish;
  maxMintSupply: BigNumberish;
  quantityLimitPerTransaction?: BigNumberish;
  waitTimeSecondsLimitPerTransaction?: BigNumberish;
  pricePerToken?: BigNumberish;
  currency?: string;
  merkleRoot?: BytesLike;
}

/**
 * @beta
 */
export interface PublicMintCondition {
  startTimestamp: BigNumberish;
  maxMintSupply: BigNumberish;
  currentMintSupply: BigNumberish;
  quantityLimitPerTransaction: BigNumberish;
  waitTimeSecondsLimitPerTransaction: BigNumberish;
  pricePerToken: BigNumberish;
  currency: string;
  merkleRoot: BytesLike;
}

/**
 * Access this module by calling {@link ThirdwebSDK.getDropModule}
 * @beta
 */
export class DropModule extends ModuleWithRoles<Drop> {
  public static moduleType: ModuleType = ModuleType.DROP;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.pauser,
    RolesMap.transfer,
  ] as const;

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
  protected connectContract(): Drop {
    return Drop__factory.connect(this.address, this.providerOrSigner);
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

  public async getAll(): Promise<NFTMetadataOwner[]> {
    const maxId = (await this.readOnlyContract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getAllUnclaimed(): Promise<NFTMetadataOwner[]> {
    const maxId = await this.readOnlyContract.nextTokenId();
    const unmintedId = await this.readOnlyContract.nextMintTokenId();
    return await Promise.all(
      Array.from(Array(maxId.sub(unmintedId).toNumber()).keys()).map((i) =>
        this.get(unmintedId.add(i).toString()),
      ),
    );
  }

  public async getAllClaimed(): Promise<NFTMetadataOwner[]> {
    const maxId = (await this.readOnlyContract.nextMintTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async ownerOf(tokenId: string): Promise<string> {
    return await this.readOnlyContract.ownerOf(tokenId);
  }

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

  public async getActiveMintCondition(): Promise<PublicMintCondition> {
    const index =
      await this.readOnlyContract.getLastStartedMintConditionIndex();
    return await this.readOnlyContract.mintConditions(index);
  }

  public async getAllMintConditions(): Promise<PublicMintCondition[]> {
    const conditions = [];
    for (let i = 0; ; i++) {
      try {
        conditions.push(await this.readOnlyContract.mintConditions(i));
      } catch (e) {
        break;
      }
    }
    return conditions;
  }

  public async totalSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.nextTokenId();
  }

  public async maxTotalSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.maxTotalSupply();
  }

  public async totalUnclaimedSupply(): Promise<BigNumber> {
    return (await this.readOnlyContract.nextTokenId()).sub(
      await this.totalClaimedSupply(),
    );
  }

  public async totalClaimedSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.nextMintTokenId();
  }

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

  // owner functions
  public async lazyMint(metadata: MetadataURIOrObject) {
    await this.lazyMintBatch([metadata]);
  }

  public async lazyMintBatch(metadatas: MetadataURIOrObject[]) {
    const uris = await Promise.all(metadatas.map((m) => uploadMetadata(m)));
    await this.sendTransaction("lazyMintBatch", [uris]);
  }

  public async lazyMintAmount(amount: BigNumberish) {
    await this.sendTransaction("lazyMintAmount", [amount]);
  }

  public async setPublicMintConditions(
    conditions: CreatePublicMintCondition[],
  ) {
    const _conditions = conditions.map((c) => ({
      startTimestamp: c.startTimestampInSeconds || 0,
      maxMintSupply: c.maxMintSupply,
      currentMintSupply: 0,
      quantityLimitPerTransaction:
        c.quantityLimitPerTransaction || c.maxMintSupply,
      waitTimeSecondsLimitPerTransaction:
        c.waitTimeSecondsLimitPerTransaction || 0,
      pricePerToken: c.pricePerToken || 0,
      currency: c.currency || AddressZero,
      merkleRoot: c.merkleRoot || hexZeroPad([0], 32),
    }));
    await this.sendTransaction("setPublicMintConditions", [_conditions]);
  }

  public async claim(quantity: BigNumberish) {
    const proofs = [hexZeroPad([0], 32)];
    const mintCondition = await this.getActiveMintCondition();
    const overrides = (await this.getCallOverrides()) || {};
    if (
      mintCondition.currency === AddressZero &&
      mintCondition.pricePerToken > 0
    ) {
      overrides["value"] = BigNumber.from(mintCondition.pricePerToken).mul(
        quantity,
      );
    }
    await this.sendTransaction("claim", [quantity, proofs], overrides);
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

  // owner functions
  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRoyaltyBps(amount: number): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRoyaltyBps", [amount]);
  }

  public async setBaseTokenUri(uri: string): Promise<TransactionReceipt> {
    return await this.sendTransaction("setBaseTokenURI", [uri]);
  }

  public async setMaxTotalSupply(
    amount: BigNumberish,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setMaxTotalSupply", [amount]);
  }

  public async setRestrictedTransfer(
    restricted: boolean,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }
}
