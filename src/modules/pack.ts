import {
  ERC1155__factory,
  ERC20__factory,
  Pack as PackContract,
  Pack__factory,
} from "@3rdweb/contracts";
import { BigNumber, BigNumberish, BytesLike, ethers } from "ethers";
import {
  CurrencyValue,
  getCurrencyValue,
  ModuleType,
  Role,
  RolesMap,
} from "../common";
import { ChainlinkVrf } from "../common/chainlink";
import { NotFoundError } from "../common/error";
import { uploadMetadata } from "../common/ipfs";
import { getMetadataWithoutContract, NFTMetadata } from "../common/nft";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 * @beta
 */
export interface PackMetadata {
  id: string;
  creator: string;
  currentSupply: BigNumber;
  openStart: Date | null;
  metadata: NFTMetadata;
}

/**
 * @public
 */
export interface PackNFTMetadata {
  supply: BigNumber;
  metadata: NFTMetadata;
}

/**
 * @beta
 */
export interface IPackCreateArgs {
  assetContract: string;
  metadata: MetadataURIOrObject;
  assets: {
    tokenId: BigNumberish;
    amount: BigNumberish;
  }[];
  secondsUntilOpenStart?: number;
  rewardsPerOpen?: number;
}

/**
 * @beta
 */
export interface IPackBatchArgs {
  tokenId: BigNumberish;
  amount: BigNumberish;
}

/**
 * Access this module by calling {@link ThirdwebSDK.getPackModule}
 * @beta
 */
export class PackModule extends ModuleWithRoles<PackContract> {
  public static moduleType: ModuleType = ModuleType.PACK;

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
    return PackModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): PackContract {
    return Pack__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return PackModule.moduleType;
  }

  public async open(packId: string): Promise<NFTMetadata[]> {
    const receipt = await this.sendTransaction("openPack", [packId]);
    const event = this.parseEventLogs("PackOpenRequest", receipt?.logs);
    const requestId = event.requestId;
    const opener = event.opener;

    const fulfillEvent: any = await new Promise((resolve) => {
      this.readOnlyContract.once(
        // eslint-disable-next-line new-cap
        this.readOnlyContract.filters.PackOpenFulfilled(null, opener),
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
    const [meta, state, supply] = await Promise.all([
      getMetadataWithoutContract(
        this.providerOrSigner,
        this.address,
        packId,
        this.ipfsGatewayUrl,
      ),
      this.readOnlyContract.getPack(packId),
      this.readOnlyContract
        .totalSupply(packId)
        .catch(() => BigNumber.from("0")),
    ]);
    const entity: PackMetadata = {
      id: packId,
      metadata: meta,
      creator: state.creator,
      currentSupply: supply,
      openStart: state.openStart.gt(0)
        ? new Date(state.openStart.toNumber() * 1000)
        : null,
    };
    return entity;
  }

  public async getAll(): Promise<PackMetadata[]> {
    const maxId = (await this.readOnlyContract.nextTokenId()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getNFTs(packId: string): Promise<PackNFTMetadata[]> {
    const packReward = await this.readOnlyContract.getPackWithRewards(packId);
    if (!packReward.source) {
      throw new NotFoundError();
    }
    const rewards = await Promise.all(
      packReward.tokenIds.map((tokenId) =>
        getMetadataWithoutContract(
          this.providerOrSigner,
          packReward.source,
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
  public async balanceOf(address: string, tokenId: string): Promise<BigNumber> {
    return await this.readOnlyContract.balanceOf(address, tokenId);
  }

  public async balance(tokenId: string): Promise<BigNumber> {
    return await this.balanceOf(await this.getSignerAddress(), tokenId);
  }

  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.readOnlyContract.isApprovedForAll(address, operator);
  }

  public async setApproval(operator: string, approved = true) {
    await this.sendTransaction("setApprovalForAll", [operator, approved]);
  }

  public async transfer(to: string, tokenId: string, amount: BigNumber) {
    await this.sendTransaction("safeTransferFrom", [
      await this.getSignerAddress(),
      to,
      tokenId,
      amount,
      [0],
    ]);
  }

  // owner functions
  public async create(args: IPackCreateArgs): Promise<PackMetadata> {
    const asset = ERC1155__factory.connect(
      args.assetContract,
      this.providerOrSigner,
    );

    const from = await this.getSignerAddress();
    const ids = args.assets.map((a) => a.tokenId);
    const amounts = args.assets.map((a) => a.amount);
    const uri = await uploadMetadata(args.metadata);

    const packParams = ethers.utils.defaultAbiCoder.encode(
      ["string", "uint256", "uint256"],
      [uri, args.secondsUntilOpenStart || 0, args.rewardsPerOpen || 1],
    );

    // TODO: make it gasless
    const tx = await asset.safeBatchTransferFrom(
      from,
      this.address,
      ids,
      amounts,
      packParams,
      await this.getCallOverrides(),
    );
    const receipt = await tx.wait();
    const event = receipt?.events?.find((e) => e.event === "PackCreated");
    const packId = event?.args?.packId;
    return await this.get(packId);
  }

  public async transferFrom(
    from: string,
    to: string,
    args: IPackBatchArgs,
    data: BytesLike = [0],
  ) {
    await this.sendTransaction("safeTransferFrom", [
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
    args: IPackBatchArgs[],
    data: BytesLike = [0],
  ) {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    await this.sendTransaction("safeBatchTransferFrom", [
      from,
      to,
      ids,
      amounts,
      data,
    ]);
  }

  // owner functions
  public async getLinkBalance(): Promise<CurrencyValue> {
    const chainId = await this.getChainID();
    const chainlink = ChainlinkVrf[chainId];
    const erc20 = ERC20__factory.connect(
      chainlink.linkTokenAddress,
      this.providerOrSigner,
    );
    return await getCurrencyValue(
      this.providerOrSigner,
      chainlink.linkTokenAddress,
      await erc20.balanceOf(this.address),
    );
  }

  public async depositLink(amount: BigNumberish) {
    const chainId = await this.getChainID();
    const chainlink = ChainlinkVrf[chainId];
    const erc20 = ERC20__factory.connect(
      chainlink.linkTokenAddress,
      this.providerOrSigner,
    );
    // TODO: make it gasless
    const tx = await erc20.transfer(
      this.address,
      amount,
      await this.getCallOverrides(),
    );
    await tx.wait();
  }

  public async withdrawLink(to: string, amount: BigNumberish) {
    await this.sendTransaction("transferLink", [to, amount]);
  }

  public async setRoyaltyBps(amount: number) {
    await this.sendTransaction("setRoyaltyBps", [amount]);
  }

  public async setModuleMetadata(metadata: MetadataURIOrObject) {
    const uri = await uploadMetadata(metadata);
    await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRestrictedTransfer(restricted = false): Promise<void> {
    await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }
}
