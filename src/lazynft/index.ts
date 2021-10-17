import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import { MetadataURIOrObject } from "../core/types";
import { LazyNFT, LazyNFT__factory } from "../../contract-interfaces";
import { getRoleHash, ModuleType, Role } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getMetadata, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { hexZeroPad } from "@ethersproject/bytes";

export interface NFTMetadataOwner {
  owner: string;
  metadata: NFTMetadata;
}

export interface CreatePublicMintCondition {
  startTimestampInSeconds?: BigNumberish;
  maxMintSupply: BigNumberish;
  quantityLimitPerTransaction?: BigNumberish;
  waitTimeSecondsLimitPerTransaction?: BigNumberish;
  pricePerToken?: BigNumberish;
  currency?: string;
  merkleRoot?: BytesLike;
}

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
 * The LazyNFTModule. This should always be created via `getLazyNFTModule()` on the main SDK.
 * @public
 */
export class LazyNFTModule extends Module {
  public static moduleType: ModuleType = ModuleType.LAZY_NFT;

  private _contract: LazyNFT | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): LazyNFT {
    return this._contract || this.connectContract();
  }
  private set contract(value: LazyNFT) {
    this._contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): LazyNFT {
    return (this.contract = LazyNFT__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  private async getMetadata(tokenId: string): Promise<NFTMetadata> {
    return await getMetadata(this.contract, tokenId, this.ipfsGatewayUrl);
  }

  public async get(tokenId: string): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId),
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

  // passthrough to the contract
  public async totalSupply(): Promise<BigNumber> {
    return await this.contract.totalSupply();
  }

  public async maxTotalSupply(): Promise<BigNumber> {
    return await this.contract.maxTotalSupply();
  }

  public async totalLazyMintedSupply(): Promise<BigNumber> {
    return await this.contract.nextTokenId();
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
    const tx = await this.contract.setApprovalForAll(
      operator,
      approved,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async transfer(to: string, tokenId: string) {
    const from = await this.getSignerAddress();
    const tx = await this.contract["safeTransferFrom(address,address,uint256)"](
      from,
      to,
      tokenId,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  // owner functions
  public async lazyMint(metadata: MetadataURIOrObject) {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.lazyMint(uri, await this.getCallOverrides());
    await tx.wait();
  }

  public async lazyMintBatch(metadatas: MetadataURIOrObject[]) {
    const uris = await Promise.all(metadatas.map((m) => uploadMetadata(m)));
    const tx = await this.contract.lazyMintBatch(
      uris,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async lazyMintAmount(amount: BigNumberish) {
    const tx = await this.contract.lazyMintAmount(
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
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
      merkleRoot: c.merkleRoot || hexZeroPad("0", 32),
    }));
    const tx = await this.contract.setPublicMintConditions(
      _conditions,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async claim(quantity: BigNumberish) {
    const proofs = [hexZeroPad("0", 32)];
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
    const tx = await this.contract.claim(quantity, proofs, overrides);
    await tx.wait();
  }

  public async burn(tokenId: BigNumberish) {
    const tx = await this.contract.burn(tokenId, await this.getCallOverrides());
    await tx.wait();
  }

  public async transferFrom(from: string, to: string, tokenId: BigNumberish) {
    const tx = await this.contract.transferFrom(
      from,
      to,
      tokenId,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  // owner functions
  public async setRoyaltyBps(amount: number) {
    const tx = await this.contract.setRoyaltyBps(
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async setModuleMetadata(metadata: MetadataURIOrObject) {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.setContractURI(
      uri,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async grantRole(role: Role, address: string) {
    const tx = await this.contract.grantRole(
      getRoleHash(role),
      address,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async revokeRole(role: Role, address: string) {
    const signerAddress = await this.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      const tx = await this.contract.renounceRole(
        getRoleHash(role),
        address,
        await this.getCallOverrides(),
      );
      await tx.wait();
    } else {
      const tx = await this.contract.revokeRole(
        getRoleHash(role),
        address,
        await this.getCallOverrides(),
      );
      await tx.wait();
    }
  }

  public async setBaseTokenUri(uri: string) {
    const tx = await this.contract.setBaseTokenURI(
      uri,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async setMaxTotalSupply(amount: BigNumberish) {
    const tx = await this.contract.setMaxTotalSupply(
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  // roles
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
