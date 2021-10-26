import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish, BytesLike } from "ethers";
import {
  LazyNFT as Drop,
  LazyNFT__factory as Drop__factory,
} from "../../contract-interfaces";
import { getRoleHash, ModuleType, Role } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getMetadata, NFTMetadata, NFTMetadataOwner } from "../common/nft";
import { Module } from "../core/module";
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
 * The DropModule. This should always be created via `getDropModule()` on the main SDK.
 * @beta
 */
export class DropModule extends Module {
  public static moduleType: ModuleType = ModuleType.DROP;

  private _contract: Drop | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): Drop {
    return this._contract || this.connectContract();
  }
  private set contract(value: Drop) {
    this._contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): Drop {
    return (this.contract = Drop__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  private async getMetadata(tokenId: string): Promise<NFTMetadata> {
    return await getMetadata(this.contract, tokenId, this.ipfsGatewayUrl);
  }

  public async get(tokenId: string): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId).catch(() => AddressZero),
      this.getMetadata(tokenId),
    ]);

    return { owner, metadata };
  }

  public async getAll(): Promise<NFTMetadataOwner[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getAllUnclaimed(): Promise<NFTMetadataOwner[]> {
    const maxId = await this.contract.nextTokenId();
    const unmintedId = await this.contract.nextMintTokenId();
    return await Promise.all(
      Array.from(Array(maxId.sub(unmintedId).toNumber()).keys()).map((i) =>
        this.get(unmintedId.add(i).toString()),
      ),
    );
  }

  public async getAllClaimed(): Promise<NFTMetadataOwner[]> {
    const maxId = (await this.contract.nextMintTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async ownerOf(tokenId: string): Promise<string> {
    return await this.contract.ownerOf(tokenId);
  }

  public async getOwned(_address?: string): Promise<NFTMetadataOwner[]> {
    const address = _address ? _address : await this.getSignerAddress();
    const balance = await this.contract.balanceOf(address);
    const indices = Array.from(Array(balance.toNumber()).keys());
    const tokenIds = await Promise.all(
      indices.map((i) => this.contract.tokenOfOwnerByIndex(address, i)),
    );
    return await Promise.all(
      tokenIds.map((tokenId) => this.get(tokenId.toString())),
    );
  }

  public async getActiveMintCondition(): Promise<PublicMintCondition> {
    const index = await this.contract.getLastStartedMintConditionIndex();
    return await this.contract.mintConditions(index);
  }

  public async getAllMintConditions(): Promise<PublicMintCondition[]> {
    const conditions = [];
    for (let i = 0; ; i++) {
      try {
        conditions.push(await this.contract.mintConditions(i));
      } catch (e) {
        break;
      }
    }
    return conditions;
  }

  // passthrough to the contract
  public async totalSupply(): Promise<BigNumber> {
    return await this.contract.nextTokenId();
  }

  public async maxTotalSupply(): Promise<BigNumber> {
    return await this.contract.maxTotalSupply();
  }

  public async totalUnclaimedSupply(): Promise<BigNumber> {
    return (await this.contract.nextTokenId()).sub(
      await this.totalClaimedSupply(),
    );
  }

  public async totalClaimedSupply(): Promise<BigNumber> {
    return await this.contract.nextMintTokenId();
  }

  public async balanceOf(address: string): Promise<BigNumber> {
    return await this.contract.balanceOf(address);
  }

  public async balance(): Promise<BigNumber> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.contract.isApprovedForAll(address, operator);
  }

  public async setApproval(operator: string, approved = true) {
    await this.sendTransaction("setApprovalForAll", [operator, approved]);
  }

  public async transfer(to: string, tokenId: string) {
    const from = await this.getSignerAddress();
    await this.sendTransaction("safeTransferFrom(address,address,uint256)", [
      from,
      to,
      tokenId,
    ]);
  }

  // owner functions
  public async lazyMint(metadata: MetadataURIOrObject) {
    const uri = await uploadMetadata(metadata);
    await this.sendTransaction("lazyMint", [uri]);
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

  public async burn(tokenId: BigNumberish) {
    await this.sendTransaction("burn", [tokenId]);
  }

  public async transferFrom(from: string, to: string, tokenId: BigNumberish) {
    await this.sendTransaction("transferFrom", [from, to, tokenId]);
  }

  // owner functions
  public async setModuleMetadata(metadata: MetadataURIOrObject) {
    const uri = await uploadMetadata(metadata);
    await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRoyaltyBps(amount: number) {
    await this.sendTransaction("setRoyaltyBps", [amount]);
  }

  public async setBaseTokenUri(uri: string) {
    await this.sendTransaction("setBaseTokenURI", [uri]);
  }

  public async setMaxTotalSupply(amount: BigNumberish) {
    await this.sendTransaction("setMaxTotalSupply", [amount]);
  }

  public async setRestrictedTransfer(restricted: boolean) {
    await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }

  // roles
  public async grantRole(role: Role, address: string) {
    await this.sendTransaction("grantRole", [getRoleHash(role), address]);
  }

  public async revokeRole(role: Role, address: string) {
    const signerAddress = await this.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      await this.sendTransaction("renounceRole", [getRoleHash(role), address]);
    } else {
      await this.sendTransaction("revokeRole", [getRoleHash(role), address]);
    }
  }

  public async getRoleMembers(role: Role): Promise<string[]> {
    const roleHash = getRoleHash(role);
    const count = (await this.contract.getRoleMemberCount(roleHash)).toNumber();
    return await Promise.all(
      Array.from(Array(count).keys()).map((i) =>
        this.contract.getRoleMember(roleHash, i),
      ),
    );
  }

  public async getAllRoleMembers(): Promise<Record<Role, string[]>> {
    const [admin, transfer, minter, pauser] = await Promise.all([
      this.getRoleMembers("admin"),
      this.getRoleMembers("transfer"),
      this.getRoleMembers("minter"),
      this.getRoleMembers("pauser"),
    ]);
    return {
      admin,
      transfer,
      minter,
      pauser,
    };
  }
}
