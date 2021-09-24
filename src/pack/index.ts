import { BigNumber } from "ethers";
import { NotFoundError } from "../common/error";
import { getMetadataWithoutContract, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import { Pack as PackContract, Pack__factory } from "../types";

interface PackMetadata {
  creator: string;
  currentSupply: BigNumber;
  openStart: Date | null;
  openEnd: Date | null;
  metadata: NFTMetadata;
}

interface PackNFT {
  supply: BigNumber;
  metadata: NFTMetadata;
}

/**
 * The PackModule. This should always be created via `getPackModule()` on the main SDK.
 * @public
 */
export class PackModule extends Module {
  private __contract: PackContract | null = null;
  private get contract(): PackContract {
    return this.__contract || this.connectContract();
  }
  private set contract(value: PackContract) {
    this.__contract = value;
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

    const event = receipt?.events?.find((e) => e.event === "PackOpenRequest");
    const args = event?.args;
    const requestId = args?.requestId as string;
    const opener = args?.opener as string;
    // const { requestId, opener } = (event?.args || {});

    const fulfillEvent: any = await new Promise((resolve) => {
      this.contract.once(
        // eslint-disable-next-line new-cap
        this.contract.filters.PackOpenFulfilled(null, opener),
        (_packId, _opener, _requestId, rewardContract, rewardIds) => {
          if (requestId === _requestId) {
            resolve({
              packId: _packId,
              opener: _opener,
              requestId,
              rewardContract,
              rewardIds,
            });
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

  public async get(packId: string): Promise<PackMetadata> {
    const [meta, state] = await Promise.all([
      await getMetadataWithoutContract(
        this.providerOrSigner,
        this.address,
        packId,
        this.ipfsGatewayUrl,
      ),
      this.contract.getPack(packId),
    ]);
    const entity: PackMetadata = {
      metadata: meta,
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

  public async getAll(): Promise<PackMetadata[]> {
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
      supply: packReward.amountsPacked[i],
      metadata: reward,
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
