/* eslint-disable new-cap */
import { NFT, NFT__factory } from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getTokenMetadata, NFTMetadata, NFTMetadataOwner } from "../common/nft";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 * Access this module by calling {@link ThirdwebSDK.getNFTModule}
 * @public
 */
export class NFTModule extends ModuleWithRoles<NFT> {
  public static moduleType: ModuleType = ModuleType.NFT;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.pauser,
    RolesMap.transfer,
  ] as const;

  protected getModuleRoles(): readonly Role[] {
    return NFTModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): NFT {
    return NFT__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return NFTModule.moduleType;
  }

  public async get(tokenId: string): Promise<NFTMetadata> {
    return await getTokenMetadata(
      this.readOnlyContract,
      tokenId,
      this.ipfsGatewayUrl,
    );
  }

  public async getAll(): Promise<NFTMetadata[]> {
    const maxId = (await this.readOnlyContract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getWithOwner(tokenId: string): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId),
      this.get(tokenId),
    ]);

    return { owner, metadata };
  }

  public async getAllWithOwner(): Promise<NFTMetadataOwner[]> {
    const maxId = (await this.readOnlyContract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) =>
        this.getWithOwner(i.toString()),
      ),
    );
  }

  /**
   * Checks the owner of a particular NFT
   *
   * @param tokenId - ID of the NFT to get the owner of
   * @returns the owner of the token, or a zero address if the
   * token has been burned
   */
  public async ownerOf(tokenId: string): Promise<string> {
    try {
      return await this.readOnlyContract.ownerOf(tokenId);
    } catch (e) {
      return AddressZero;
    }
  }

  public async getOwned(_address?: string): Promise<NFTMetadata[]> {
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

  public async totalSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.totalSupply();
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
  public async mint(metadata: MetadataURIOrObject): Promise<NFTMetadata> {
    return await this.mintTo(await this.getSignerAddress(), metadata);
  }

  public async mintTo(
    to: string,
    metadata: MetadataURIOrObject,
  ): Promise<NFTMetadata> {
    const uri = await uploadMetadata(metadata);
    const receipt = await this.sendTransaction("mintNFT", [to, uri]);
    const event = this.parseEventLogs("Minted", receipt?.logs);
    const tokenId = event?.tokenId;
    return await this.get(tokenId.toString());
  }

  public async mintBatch(
    metadatas: MetadataURIOrObject[],
  ): Promise<NFTMetadata[]> {
    return await this.mintBatchTo(await this.getSignerAddress(), metadatas);
  }

  public async mintBatchTo(
    to: string,
    metadatas: MetadataURIOrObject[],
  ): Promise<NFTMetadata[]> {
    const uris = await Promise.all(metadatas.map((m) => uploadMetadata(m)));
    const receipt = await this.sendTransaction("mintNFTBatch", [to, uris]);
    const event = this.parseEventLogs("MintedBatch", receipt?.logs);
    const tokenIds = event.tokenIds;
    return await Promise.all(
      tokenIds.map((tokenId: BigNumber) => this.get(tokenId.toString())),
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

  // owner functions
  public async setRestrictedTransfer(
    restricted = false,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
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
}
