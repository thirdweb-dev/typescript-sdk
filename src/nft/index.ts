import type { ProviderOrSigner } from "../core";
import { BigNumber } from "@ethersproject/bignumber";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { NFTCollection, NFTCollection__factory } from "../types";
import { NFTMetadata, getMetadata } from "../common/nft";

export class NFTSDK extends SubSDK {
  public readonly contract: NFTCollection;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    super(providerOrSigner, address, opts);

    this.contract = NFTCollection__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  public async get(tokenId: string): Promise<NFTMetadata> {
    return getMetadata(
      this.providerOrSigner,
      this.address,
      tokenId,
      this.opts.ipfsGatewayUrl,
    );
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
