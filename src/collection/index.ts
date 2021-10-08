import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "ethers";
import { MetadataURIOrObject } from "../core/types";
import {
  NFTCollection as NFTCollectionContract,
  NFTCollection__factory,
} from "../../contract-interfaces";
import { ModuleType } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getMetadata, NFTMetadata } from "../common/nft";
import { getRoleHash, Role } from "../common/role";
import { Module } from "../core/module";

/**
 * @public
 */
export interface CollectionMetadata {
  creator: string;
  supply: BigNumber;
  metadata?: NFTMetadata;
}

/**
 * @public
 */
export interface INFTCollectionCreateArgs {
  metadata: MetadataURIOrObject;
  supply: BigNumberish;
}

/**
 * @public
 */
export interface INFTCollectionBatchArgs {
  tokenId: BigNumberish;
  amount: BigNumberish;
}
/**
 * The CollectionModule. This should always be created via `getCollectionModule()` on the main SDK.
 * @public
 */
export class CollectionModule extends Module {
  public static moduleType: ModuleType = ModuleType.COLLECTION;

  private _contract: NFTCollectionContract | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): NFTCollectionContract {
    return this._contract || this.connectContract();
  }
  private set contract(value: NFTCollectionContract) {
    this._contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): NFTCollectionContract {
    return (this.contract = NFTCollection__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  /**
   *
   * Get a signle collection item by tokenId.
   * @param tokenId - the unique token id of the nft
   * @returns A promise that resolves to a `CollectionMetadata`.
   */
  public async get(tokenId: string): Promise<CollectionMetadata> {
    const [metadata, creator, supply] = await Promise.all([
      getMetadata(this.contract, tokenId, this.ipfsGatewayUrl),
      this.contract.creator(tokenId),
      this.contract.totalSupply(tokenId).catch(() => BigNumber.from("0")),
    ]);
    return {
      creator,
      supply,
      metadata,
    };
  }

  /**
   * Return all items in the collection.
   * @returns An array of `INFTCollection`.
   */
  public async getAll(): Promise<CollectionMetadata[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  // passthrough to the contract
  public async balanceOf(address: string, tokenId: string): Promise<BigNumber> {
    return await this.contract.balanceOf(address, tokenId);
  }

  public async balance(tokenId: string): Promise<BigNumber> {
    return await this.contract.balanceOf(
      await this.getSignerAddress(),
      tokenId,
    );
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

  public async transfer(to: string, tokenId: string, amount: BigNumberish) {
    const tx = await this.contract.safeTransferFrom(
      await this.getSignerAddress(),
      to,
      tokenId,
      amount,
      [0],
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  // owner functions
  public async create(
    metadata: MetadataURIOrObject,
  ): Promise<CollectionMetadata> {
    return (await this.createBatch([metadata]))[0];
  }

  public async createBatch(
    metadatas: MetadataURIOrObject[],
  ): Promise<CollectionMetadata[]> {
    const metadataWithSupply = metadatas.map((m) => ({
      metadata: m,
      supply: 0,
    }));
    return this.createAndMintBatch(metadataWithSupply);
  }

  public async createAndMint(
    metadataWithSupply: INFTCollectionCreateArgs,
  ): Promise<CollectionMetadata> {
    return (await this.createAndMintBatch([metadataWithSupply]))[0];
  }

  public async createAndMintBatch(
    metadataWithSupply: INFTCollectionCreateArgs[],
  ): Promise<CollectionMetadata[]> {
    const uris = await Promise.all(
      metadataWithSupply.map((a) => a.metadata).map((a) => uploadMetadata(a)),
    );
    const supplies = metadataWithSupply.map((a) => a.supply);
    const tx = await this.contract.createNativeTokens(
      uris,
      supplies,
      await this.getCallOverrides(),
    );
    const receipt = await tx.wait();
    const event = receipt?.events?.find((e) => e.event === "NativeTokens");
    const tokenIds = event?.args?.tokenIds;
    return await Promise.all(
      tokenIds.map((tokenId: BigNumber) => this.get(tokenId.toString())),
    );
  }

  public async createWithERC20(
    tokenContract: string,
    tokenAmount: BigNumberish,
    args: INFTCollectionCreateArgs,
  ) {
    const uri = await uploadMetadata(args.metadata);
    const tx = await this.contract.wrapERC20(
      tokenContract,
      tokenAmount,
      args.supply,
      uri,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async createWithERC721(
    tokenContract: string,
    tokenId: BigNumberish,
    metadata: MetadataURIOrObject,
  ) {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.wrapERC721(
      tokenContract,
      tokenId,
      uri,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async mint(args: INFTCollectionBatchArgs) {
    await this.mintTo(await this.getSignerAddress(), args);
  }

  public async mintTo(
    to: string,
    args: INFTCollectionBatchArgs,
    data: BytesLike = [0],
  ) {
    const tx = await this.contract.mint(
      to,
      args.tokenId,
      args.amount,
      data,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async mintBatch(args: INFTCollectionBatchArgs[]) {
    await this.mintBatchTo(await this.getSignerAddress(), args);
  }

  public async mintBatchTo(
    to: string,
    args: INFTCollectionBatchArgs[],
    data: BytesLike = [0],
  ) {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    const tx = await this.contract.mintBatch(
      to,
      ids,
      amounts,
      data,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async burn(args: INFTCollectionBatchArgs) {
    await this.burnFrom(await this.getSignerAddress(), args);
  }

  public async burnBatch(args: INFTCollectionBatchArgs[]) {
    await this.burnBatchFrom(await this.getSignerAddress(), args);
  }

  public async burnFrom(account: string, args: INFTCollectionBatchArgs) {
    const tx = await this.contract.burn(
      account,
      args.tokenId,
      args.amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async burnBatchFrom(account: string, args: INFTCollectionBatchArgs[]) {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    const tx = await this.contract.burnBatch(
      account,
      ids,
      amounts,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async transferFrom(
    from: string,
    to: string,
    args: INFTCollectionBatchArgs,
    data: BytesLike = [0],
  ) {
    const tx = await this.contract.safeTransferFrom(
      from,
      to,
      args.tokenId,
      args.amount,
      data,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async transferBatchFrom(
    from: string,
    to: string,
    args: INFTCollectionBatchArgs[],
    data: BytesLike = [0],
  ) {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    const tx = await this.contract.safeBatchTransferFrom(
      from,
      to,
      ids,
      amounts,
      data,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

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

  public async getRoleMembers(role: Role): Promise<string[]> {
    const roleHash = getRoleHash(role);
    const count = (await this.contract.getRoleMemberCount(roleHash)).toNumber();
    if (count === 0) {
      return [];
    }
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
