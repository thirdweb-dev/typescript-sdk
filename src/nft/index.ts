import { BigNumberish } from "ethers";
import { getMetadata, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { NFT, NFT__factory } from "../types";

interface CreateArgs {
  uri?: string;
  metadata?: Record<string, any>;
}

/**
 * @public
 */
export class NFTModule extends Module {
  private _contract: NFT | null = null;
  private get contract(): NFT {
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
  public mint = async (to: string, args: CreateArgs) => {
    // TODO
  };

  public mintBatch = async (to: string, args: CreateArgs[]) => {
    // TODO
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
}
