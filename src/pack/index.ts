import type { SDKOptions, ProviderOrSigner } from "../core";
import { NFTMetadata, getMetadata } from "../common/nft";
import { BigNumber } from "@ethersproject/bignumber";
import { SubSDK } from "../core/sub-sdk";
import { Pack, Pack__factory } from "../types";
import { NotFoundError } from "../common/error";

export interface PackEntity extends NFTMetadata {
  creator: string;
  currentSupply: BigNumber;
  openStart?: Date;
  openEnd?: Date;
}

export interface RewardEntity extends NFTMetadata {
  supply: BigNumber;
}

export class PackSDK extends SubSDK {
  public readonly contract: Pack;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    super(providerOrSigner, address, opts);

    this.contract = Pack__factory.connect(this.address, this.providerOrSigner);
  }

  public async open(packId: string): Promise<NFTMetadata[]> {
    const tx = await this.contract.openPack(packId);
    const receipt = await tx.wait();

    const {
      args: { requestId, opener },
    } = receipt.events.find((event) => event.event === "PackOpenRequest");

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
        getMetadata(
          this.providerOrSigner,
          this.address,
          rewardId.toString(),
          this.opts.ipfsGatewayUrl,
        ),
      ),
    );
  }

  public async get(packId: string): Promise<PackEntity> {
    const [meta, state] = await Promise.all([
      await getMetadata(
        this.providerOrSigner,
        this.address,
        packId,
        this.opts.ipfsGatewayUrl,
      ),
      this.contract.getPack(packId),
    ]);
    const entity: PackEntity = {
      ...meta,
      creator: state.creator,
      currentSupply: state.currentSupply,
      openStart: state.openStart.gt(0)
        ? new Date(state.openStart.toNumber() * 1000)
        : null,
      openEnd: state.openEnd.lte(Number.MAX_SAFE_INTEGER - 1)
        ? new Date(state.openEnd.toNumber() * 1000)
        : null,
    };
    return entity;
  }

  public async getAll(): Promise<NFTMetadata[]> {
    const maxId = (await this.contract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getRewards(packId: string): Promise<RewardEntity[]> {
    const packReward = await this.contract.getPackWithRewards(packId);
    if (!packReward.source) {
      throw new NotFoundError();
    }
    const rewards = await Promise.all(
      packReward.tokenIds.map((tokenId) =>
        getMetadata(
          this.providerOrSigner,
          this.address,
          tokenId.toString(),
          this.opts.ipfsGatewayUrl,
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
