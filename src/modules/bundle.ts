import {
  NFTCollection as NFTBundleContract,
  NFTCollection__factory,
  ERC721__factory,
} from "@3rdweb/contracts";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { TransactionReceipt } from "@ethersproject/providers";
import { BytesLike } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getTokenMetadata, NFTMetadata } from "../common/nft";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 * @beta
 */

export interface BundleMetadata {
  creator: string;
  supply: BigNumber;
  metadata: NFTMetadata;
  ownedByAddress: number;
}
export interface CollectionMetadata {
  creator: string;
  supply: BigNumber;
  metadata: NFTMetadata;
  ownedByAddress: number;
}

/**
 * @beta
 */

export interface INFTBundleCreateArgs {
  metadata: MetadataURIOrObject;
  supply: BigNumberish;
}
export interface INFTCollectionCreateArgs {
  metadata: MetadataURIOrObject;
  supply: BigNumberish;
}

/**
 * @beta
 */

export interface INFTCollectionBatchArgs {
  tokenId: BigNumberish;
  amount: BigNumberish;
}

export interface INFTBundleBatchArgs {
  tokenId: BigNumberish;
  amount: BigNumberish;
}

/**
 * Access this module by calling {@link ThirdwebSDK.getBundleModule}
 * @beta
 */
export class BundleModule extends ModuleWithRoles<NFTBundleContract> {
  public static moduleType: ModuleType = ModuleType.BUNDLE;

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
    return BundleModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): NFTBundleContract {
    return NFTCollection__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return BundleModule.moduleType;
  }

  /**
   *
   * Get a single bundle item by tokenId.
   * @param tokenId - the unique token id of the nft
   * @returns A promise that resolves to a `BundleMetadata`.
   */
  public async get(tokenId: string, address?: string): Promise<BundleMetadata> {
    const [metadata, creator, supply, ownedByAddress] = await Promise.all([
      getTokenMetadata(this.readOnlyContract, tokenId, this.ipfsGatewayUrl),
      this.readOnlyContract.creator(tokenId),
      this.readOnlyContract
        .totalSupply(tokenId)
        .catch(() => BigNumber.from("0")),
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
   * Return all items in the bundle.
   * @returns An array of `INFTBundle`.
   */
  public async getAll(address?: string): Promise<BundleMetadata[]> {
    const maxId = (await this.readOnlyContract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) =>
        this.get(i.toString(), address),
      ),
    );
  }

  public async balanceOf(address: string, tokenId: string): Promise<BigNumber> {
    return await this.readOnlyContract.balanceOf(address, tokenId);
  }

  public async balance(tokenId: string): Promise<BigNumber> {
    return await this.readOnlyContract.balanceOf(
      await this.getSignerAddress(),
      tokenId,
    );
  }

  public async isApproved(
    address: string,
    operator: string,
    assetContract?: string,
    assetId?: BigNumberish,
  ): Promise<boolean> {
    if (!assetContract) {
      return await this.readOnlyContract.isApprovedForAll(address, operator);
    }
    if (!assetId) {
      throw new Error("tokenId is required");
    }
    const contract = ERC721__factory.connect(
      assetContract,
      this.providerOrSigner,
    );
    const approved = await contract.isApprovedForAll(
      await this.getSignerAddress(),
      this.address,
    );
    const isTokenApproved =
      (await contract.getApproved(assetId)).toLowerCase() ===
      this.address.toLowerCase();
    return approved || isTokenApproved;
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
    return await this.transferFrom(
      await this.getSignerAddress(),
      to,
      { tokenId, amount },
      [0],
    );
  }

  // owner functions
  public async create(metadata: MetadataURIOrObject): Promise<BundleMetadata> {
    return (await this.createBatch([metadata]))[0];
  }

  public async createBatch(
    metadatas: MetadataURIOrObject[],
  ): Promise<BundleMetadata[]> {
    const metadataWithSupply = metadatas.map((m) => ({
      metadata: m,
      supply: 0,
    }));
    return this.createAndMintBatch(metadataWithSupply);
  }

  public async createAndMint(
    metadataWithSupply: INFTBundleCreateArgs,
  ): Promise<BundleMetadata> {
    return (await this.createAndMintBatch([metadataWithSupply]))[0];
  }

  public async createAndMintBatch(
    metadataWithSupply: INFTBundleCreateArgs[],
  ): Promise<BundleMetadata[]> {
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

  public async createWithToken(
    tokenContract: string,
    tokenAmount: BigNumberish,
    args: INFTBundleCreateArgs,
  ) {
    const uri = await uploadMetadata(args.metadata);
    await this.sendTransaction("wrapERC20", [
      tokenContract,
      tokenAmount,
      args.supply,
      uri,
    ]);
  }
  public async createWithErc20(
    tokenContract: string,
    tokenAmount: BigNumberish,
    args: INFTBundleCreateArgs,
  ) {
    return this.createWithToken(tokenContract, tokenAmount, args);
  }

  public async createWithNFT(
    tokenContract: string,
    tokenId: BigNumberish,
    metadata: MetadataURIOrObject,
  ) {
    const uri = await uploadMetadata(metadata);
    await this.sendTransaction("wrapERC721", [tokenContract, tokenId, uri]);
  }
  public async createWithERC721(
    tokenContract: string,
    tokenId: BigNumberish,
    metadata: MetadataURIOrObject,
  ) {
    return this.createWithNFT(tokenContract, tokenId, metadata);
  }

  public async mint(args: INFTBundleBatchArgs) {
    await this.mintTo(await this.getSignerAddress(), args);
  }

  public async mintTo(
    to: string,
    args: INFTBundleBatchArgs,
    data: BytesLike = [0],
  ) {
    await this.sendTransaction("mint", [to, args.tokenId, args.amount, data]);
  }

  public async mintBatch(args: INFTBundleBatchArgs[]) {
    await this.mintBatchTo(await this.getSignerAddress(), args);
  }

  public async mintBatchTo(
    to: string,
    args: INFTBundleBatchArgs[],
    data: BytesLike = [0],
  ) {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    await this.sendTransaction("mintBatch", [to, ids, amounts, data]);
  }

  public async burn(args: INFTBundleBatchArgs): Promise<TransactionReceipt> {
    return await this.burnFrom(await this.getSignerAddress(), args);
  }

  public async burnBatch(
    args: INFTBundleBatchArgs[],
  ): Promise<TransactionReceipt> {
    return await this.burnBatchFrom(await this.getSignerAddress(), args);
  }

  public async burnFrom(
    account: string,
    args: INFTBundleBatchArgs,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("burn", [
      account,
      args.tokenId,
      args.amount,
    ]);
  }

  public async burnBatchFrom(
    account: string,
    args: INFTBundleBatchArgs[],
  ): Promise<TransactionReceipt> {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    return await this.sendTransaction("burnBatch", [account, ids, amounts]);
  }

  public async transferFrom(
    from: string,
    to: string,
    args: INFTBundleBatchArgs,
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
    args: INFTBundleBatchArgs[],
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

  /**
   * `getOwned` is a convenience method for getting all owned tokens
   * for a particular wallet.
   *
   * @param _address - The address to check for token ownership
   * @returns An array of BundleMetadata objects that are owned by the address
   */
  public async getOwned(_address?: string): Promise<BundleMetadata[]> {
    const address = _address ? _address : await this.getSignerAddress();
    const maxId = await this.readOnlyContract.nextTokenId();
    const balances = await this.readOnlyContract.balanceOfBatch(
      Array(maxId.toNumber()).fill(address),
      Array.from(Array(maxId.toNumber()).keys()),
    );

    const ownedBalances = balances
      .map((b, i) => {
        return {
          tokenId: i,
          balance: b,
        };
      })
      .filter((b) => b.balance.gt(0));
    return await Promise.all(
      ownedBalances.map(async (b) => await this.get(b.tokenId.toString())),
    );
  }
}
