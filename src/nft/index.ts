import { BigNumberish } from "ethers";
import { ModuleType } from "../common";
import { uploadMetadata } from "../common/ipfs";
import { getMetadata, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { NFT, NFT__factory } from "../types";

/**
 * The MarketModule. This should always be created via `getMarketModule()` on the main SDK.
 * @public
 */
export class NFTModule extends Module {
  public static moduleType: ModuleType = ModuleType.NFT;

  private _contract: NFT | null = null;
  /**
   * @deprecated - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): NFT {
    return this._contract || this.connectContract();
  }
  private set contract(value: NFT) {
    this._contract = value;
  }

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

  public async getOwned(_address?: string): Promise<NFTMetadata[]> {
    const address = _address ? _address : await this.getSignerAddress();
    const balance = await this.contract.balanceOf(address);
    const indices = Array.from(Array(balance).keys());
    const tokenIds = await Promise.all(
      indices.map((i) => this.contract.tokenOfOwnerByIndex(address, i)),
    );
    return await Promise.all(
      tokenIds.map((tokenId) => this.get(tokenId.toString())),
    );
  }

  // passthrough to the contract
  public totalSupply = async () => this.contract.totalSupply();

  public balanceOf = async (address: string) =>
    this.contract.balanceOf(address);

  public balance = async () =>
    this.contract.balanceOf(await this.getSignerAddress());

  public isApproved = async (address: string, operator: string) =>
    this.contract.isApprovedForAll(address, operator);

  public setApproval = async (operator: string, approved = true) => {
    const tx = await this.contract.setApprovalForAll(operator, approved);
    await tx.wait();
  };

  public transfer = async (to: string, tokenId: string) => {
    const from = await this.getSignerAddress();
    const tx = await this.contract["safeTransferFrom(address,address,uint256)"](
      from,
      to,
      tokenId,
    );
    await tx.wait();
  };

  // owner functions
  public mint = async (
    to: string,
    metadata: string | Record<string, any>,
  ): Promise<NFTMetadata> => {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.mintNFT(to, uri);
    const receipt = await tx.wait();
    const event = receipt?.events?.find((e) => e.event === "Minted");
    const tokenId = event?.args?.tokenId;
    return await this.get(tokenId);
  };

  public mintBatch = async (
    to: string,
    metadatas: (string | Record<string, any>)[],
  ): Promise<NFTMetadata[]> => {
    // TODO: update new abi
    // const uris = await Promise.all(metadatas.map((m) => uploadMetadata(m)));
    // const tx = await this.contract.mintNFTBatch(to, uris);
    // const receipt = await tx.wait();
    // const event = receipt?.events?.find((e) => e.event === "MintedBatch");
    // const tokenIds = event?.args?.tokenIds;
    // return await Promise.all(tokenIds.map((tokenId) => this.get(tokenId)));
    return [];
  };

  public burn = async (tokenId: BigNumberish) => {
    const tx = await this.contract.burn(tokenId);
    await tx.wait();
  };

  public transferFrom = async (
    from: string,
    to: string,
    tokenId: BigNumberish,
  ) => {
    const tx = await this.contract.transferFrom(from, to, tokenId);
    await tx.wait();
  };

  public setRoyaltyBps = async (amount: number) => {
    // const tx = await this.contract.setRoyaltyBps(amount);
    // await tx.wait();
  };

  public setRoyaltyReceiver = async (receiver: string) => {
    // const tx = await this.contract.setRoyaltyReceiver(receiver);
    // await tx.wait();
  };

  public setContractURI = async (metadata: string | Record<string, any>) => {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.setContractURI(uri);
    await tx.wait();
  };
}
