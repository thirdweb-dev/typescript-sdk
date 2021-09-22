import { BigNumber } from "@ethersproject/bignumber";
import { NotFoundError } from "../common/error";
import { getMetadataWithoutContract, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { Pack as PackContract, Pack__factory } from "../types";

export interface Pack extends NFTMetadata {
  creator: string;
  currentSupply: BigNumber;
  openStart?: Date;
  openEnd?: Date;
}

export interface PackNFT extends NFTMetadata {
  supply: BigNumber;
}

export class PackSDK extends Module {
  private _contract: PackContract | null = null;
  public get contract(): PackContract {
    return this._contract || this.connectContract();
  }
  private set contract(value: PackContract) {
    this._contract = value;
  }

  protected connectContract(): PackContract {
    return (this.contract = Pack__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async open(packId: string): Promise<NFTMetadata[]> {
    const tx = await this.contract.openPack(packId);
    const receipt = await tx.wait();

    const event = receipt?.events?.find(
      (event) => event.event === "PackOpenRequest",
    );
    const { requestId, opener } = (event?.args || {}) as any;

    const fulfillEvent: any = await new Promise((resolve) => {
      this.contract.once(
        this.contract.filters.PackOpenFulfilled(null, opener),
        (packId, opener, _requestId, rewardContract, rewardIds) => {
          if (requestId === _requestId) {
            resolve({ packId, opener, requestId, rewardContract, rewardIds });
          }
        },
      );
    });
    const { rewardIds } = fulfillEvent;
    return await Promise.all(
      rewardIds.map((rewardId: BigNumber) =>
        getMetadataWithoutContract(
          this.providerOrSigner,
          this.address,
          rewardId.toString(),
          this.ipfsGatewayUrl,
        ),
      ),
    );
  }

  public async get(packId: string): Promise<Pack> {
    const [meta, state] = await Promise.all([
      await getMetadataWithoutContract(
        this.providerOrSigner,
        this.address,
        packId,
        this.ipfsGatewayUrl,
      ),
      this.contract.getPack(packId),
    ]);
    const entity: Pack = {
      ...meta,
      creator: state.creator,
      currentSupply: state.currentSupply,
      openStart: state.openStart.gt(0)
        ? new Date(state.openStart.toNumber() * 1000)
        : undefined,
      openEnd: state.openEnd.lte(Number.MAX_SAFE_INTEGER - 1)
        ? new Date(state.openEnd.toNumber() * 1000)
        : undefined,
    };
    return entity;
  }

  public async getAll(): Promise<Pack[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getNFTs(packId: string): Promise<PackNFT[]> {
    const packReward = await this.contract.getPackWithRewards(packId);
    if (!packReward.source) {
      throw new NotFoundError();
    }
    const rewards = await Promise.all(
      packReward.tokenIds.map((tokenId) =>
        getMetadataWithoutContract(
          this.providerOrSigner,
          this.address,
          tokenId.toString(),
          this.ipfsGatewayUrl,
        ),
      ),
    );
    return rewards.map((reward, i) => ({
      ...reward,
      supply: packReward.amountsPacked[i],
    }));
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
