import {
  NFTCollection as NFTCollectionContract,
  NFTCollection__factory,
} from "@3rdweb/contracts";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { TransactionReceipt } from "@ethersproject/providers";
import { BytesLike } from "ethers";
import { ModuleType } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getMetadata, NFTMetadata } from "../common/nft";
import { getRoleHash, Role } from "../common/role";
import { Module } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 * @public
 */
export interface CollectionMetadata {
  creator: string;
  supply: BigNumber;
  metadata: NFTMetadata;
  ownedByAddress: number;
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
   * @internal
   */
  protected getModuleType(): ModuleType {
    return CollectionModule.moduleType;
  }

  /**
   *
   * Get a single collection item by tokenId.
   * @param tokenId - the unique token id of the nft
   * @returns A promise that resolves to a `CollectionMetadata`.
   */
  public async get(
    tokenId: string,
    address?: string,
  ): Promise<CollectionMetadata> {
    const [metadata, creator, supply, ownedByAddress] = await Promise.all([
      getMetadata(this.contract, tokenId, this.ipfsGatewayUrl),
      this.contract.creator(tokenId),
      this.contract.totalSupply(tokenId).catch(() => BigNumber.from("0")),
      address ? (await this.balanceOf(address, tokenId)).toNumber() : 0,
    ]);
    return {
      creator,
      supply,
      metadata,
      ownedByAddress,
    };
  }

  /**
   * Return all items in the collection.
   * @returns An array of `INFTCollection`.
   */
  public async getAll(address?: string): Promise<CollectionMetadata[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) =>
        this.get(i.toString(), address),
      ),
    );
  }

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
    amount: BigNumberish,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("safeTransferFrom", [
      to,
      tokenId,
      amount,
      [0],
    ]);
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
    const to = await this.getSignerAddress();
    const receipt = await this.sendTransaction("createNativeTokens", [
      to,
      uris,
      supplies,
      [0],
    ]);
    const event = this.parseEventLogs("NativeTokens", receipt?.logs);
    const tokenIds = event?.tokenIds;
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
    await this.sendTransaction("wrapERC20", [
      tokenContract,
      tokenAmount,
      args.supply,
      uri,
    ]);
  }

  public async createWithERC721(
    tokenContract: string,
    tokenId: BigNumberish,
    metadata: MetadataURIOrObject,
  ) {
    const uri = await uploadMetadata(metadata);
    await this.sendTransaction("wrapERC721", [tokenContract, tokenId, uri]);
  }

  public async mint(args: INFTCollectionBatchArgs) {
    await this.mintTo(await this.getSignerAddress(), args);
  }

  public async mintTo(
    to: string,
    args: INFTCollectionBatchArgs,
    data: BytesLike = [0],
  ) {
    await this.sendTransaction("mint", [to, args.tokenId, args.amount, data]);
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
    await this.sendTransaction("mintBatch", [to, ids, amounts, data]);
  }

  public async burn(
    args: INFTCollectionBatchArgs,
  ): Promise<TransactionReceipt> {
    return await this.burnFrom(await this.getSignerAddress(), args);
  }

  public async burnBatch(
    args: INFTCollectionBatchArgs[],
  ): Promise<TransactionReceipt> {
    return await this.burnBatchFrom(await this.getSignerAddress(), args);
  }

  public async burnFrom(
    account: string,
    args: INFTCollectionBatchArgs,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("burn", [
      account,
      args.tokenId,
      args.amount,
    ]);
  }

  public async burnBatchFrom(
    account: string,
    args: INFTCollectionBatchArgs[],
  ): Promise<TransactionReceipt> {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    return await this.sendTransaction("burnBatch", [account, ids, amounts]);
  }

  public async transferFrom(
    from: string,
    to: string,
    args: INFTCollectionBatchArgs,
    data: BytesLike = [0],
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("safeTransferFrom", [
      from,
      to,
      args.tokenId,
      args.amount,
      data,
    ]);
  }

  public async transferBatchFrom(
    from: string,
    to: string,
    args: INFTCollectionBatchArgs[],
    data: BytesLike = [0],
  ): Promise<TransactionReceipt> {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    return await this.sendTransaction("safeBatchTransferFrom", [
      from,
      to,
      ids,
      amounts,
      data,
    ]);
  }

  public async setRoyaltyBps(amount: number): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRoyaltyBps", [amount]);
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRestrictedTransfer(
    restricted = false,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }

  // roles
  public async grantRole(
    role: Role,
    address: string,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("grantRole", [
      getRoleHash(role),
      address,
    ]);
  }

  public async revokeRole(
    role: Role,
    address: string,
  ): Promise<TransactionReceipt> {
    const signerAddress = await this.getSignerAddress();
    if (signerAddress.toLowerCase() === address.toLowerCase()) {
      return await this.sendTransaction("renounceRole", [
        getRoleHash(role),
        address,
      ]);
    } else {
      return await this.sendTransaction("revokeRole", [
        getRoleHash(role),
        address,
      ]);
    }
  }
}
