import { BigNumber } from "@ethersproject/bignumber";
import { getMetadata, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { NFTCollection, NFTCollection__factory } from "../types";

export class NFTSDK extends Module {
  private _contract: NFTCollection | null = null;
  public get contract(): NFTCollection {
    return this._contract || this.connectContract();
  }
  private set contract(value: NFTCollection) {
    this._contract = value;
  }

  protected connectContract(): NFTCollection {
    return (this.contract = NFTCollection__factory.connect(
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

  // passthrough to the contract
  public balanceOf = async (address: string, tokenId: string) =>
    this.contract.balanceOf(address, tokenId);

  public balance = async (tokenId: string) =>
    this.contract.balanceOf(await this.getSignerAddress(), tokenId);

  public transfer = async (to: string, tokenId: string, amount: BigNumber) => {
    const tx = await this.contract.safeTransferFrom(
      await this.getSignerAddress(),
      to,
      tokenId,
      amount,
      [0],
    );
    await tx.wait();
  };
}
