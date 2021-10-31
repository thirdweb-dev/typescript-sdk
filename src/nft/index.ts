/* eslint-disable new-cap */
import { BigNumber, BigNumberish, ethers } from "ethers";
import { MetadataURIOrObject } from "../core/types";
import { NFT, NFT__factory } from "@3rdweb/contracts";
import { getRoleHash, ModuleType, Role } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getMetadata, NFTMetadata, NFTMetadataOwner } from "../common/nft";
import { Module } from "../core/module";
import { TransactionReceipt } from "@ethersproject/providers";

/**
 * The NFTModule. This should always be created via `getNFTModule()` on the main SDK.
 * @public
 */
export class NFTModule extends Module {
  public static moduleType: ModuleType = ModuleType.NFT;

  private _contract: NFT | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): NFT {
    return this._contract || this.connectContract();
  }
  private set contract(value: NFT) {
    this._contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): NFT {
    return (this.contract = NFT__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async get(tokenId: string): Promise<NFTMetadata> {
    return await getMetadata(this.contract, tokenId, this.ipfsGatewayUrl);
  }

  public async getAll(): Promise<NFTMetadata[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getWithOwner(tokenId: string): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId),
      getMetadata(this.contract, tokenId, this.ipfsGatewayUrl),
    ]);

    return { owner, metadata };
  }

  public async getAllWithOwner(): Promise<NFTMetadataOwner[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) =>
        this.getWithOwner(i.toString()),
      ),
    );
  }

  public async ownerOf(tokenId: string): Promise<string> {
    return await this.contract.ownerOf(tokenId);
  }

  public async getOwned(_address?: string): Promise<NFTMetadata[]> {
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

  public async totalSupply(): Promise<BigNumber> {
    return await this.contract.totalSupply();
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
