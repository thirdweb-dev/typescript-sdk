import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "ethers";
import { getMetadata, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import {
  NFTCollection as NFTCollectionContract,
  NFTCollection__factory,
} from "../types";

/**
 * @public
 */
export interface INFTCollection {
  creatorAddress: string;
  supply: BigNumber;
  metadata?: NFTMetadata;
}

/**
 * @public
 */
export interface INFTCollectionCreateArgs {
  uri?: string;
  metadata?: Record<string, any>;
  supply: BigNumberish;
}

interface IBatchActionArgs {
  tokenId: BigNumberish;
  amount: BigNumberish;
}
/**
 * The CollectionModule. This should always be created via `getCollectionModule()` on the main SDK.
 * @public
 */
export class CollectionModule extends Module {
  private _contract: NFTCollectionContract | null = null;
  public get contract(): NFTCollectionContract {
    return this._contract || this.connectContract();
  }
  private set contract(value: NFTCollectionContract) {
    this._contract = value;
  }

  protected connectContract(): NFTCollectionContract {
    return (this.contract = NFTCollection__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  /**
   *
   * Get a signle collection item by tokenId.
   * @param tokenId - TODO description of tokenId
   * @returns A promise that resolves to a `INFTCollection`.
   */
  public async get(tokenId: string): Promise<INFTCollection> {
    const info = await this.contract.nftInfo(tokenId);
    const metadata = await getMetadata(
      this.contract,
      tokenId,
      this.ipfsGatewayUrl,
    );
    return {
      creatorAddress: info.creator,
      supply: info.supply,
      metadata,
    };
  }

  /**
   * Return all items in the collection.
   * @returns An array of `INFTCollection`.
   */
  public async getAll(): Promise<INFTCollection[]> {
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

  public isApproved = async (address: string, operator: string) =>
    this.contract.isApprovedForAll(address, operator);

  public setApproval = async (operator: string, approved = true) => {
    const tx = await this.contract.setApprovalForAll(operator, approved);
    await tx.wait();
  };

  public transfer = async (
    to: string,
    tokenId: string,
    amount: BigNumberish,
  ) => {
    const tx = await this.contract.safeTransferFrom(
      await this.getSignerAddress(),
      to,
      tokenId,
      amount,
      [0],
    );
    await tx.wait();
  };

  // owner functions
  public create = async (args: INFTCollectionCreateArgs[]) => {
    // TODO
    // args.map(... uploadToIpfs...)
  };

  public mint = async (
    to: string,
    args: IBatchActionArgs,
    data: BytesLike = [0],
  ) => {
    const tx = await this.contract.mint(to, args.tokenId, args.amount, data);
    await tx.wait();
  };

  public mintBatch = async (
    to: string,
    args: IBatchActionArgs[],
    data: BytesLike = [0],
  ) => {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    const tx = await this.contract.mintBatch(to, ids, amounts, data);
    await tx.wait();
  };

  public burn = async (account: string, args: IBatchActionArgs) => {
    const tx = await this.contract.burn(account, args.tokenId, args.amount);
    await tx.wait();
  };

  public burnBatch = async (account: string, args: IBatchActionArgs[]) => {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    const tx = await this.contract.burnBatch(account, ids, amounts);
    await tx.wait();
  };

  public transferFrom = async (
    from: string,
    to: string,
    args: IBatchActionArgs,
    data: BytesLike = [0],
  ) => {
    const tx = await this.contract.safeTransferFrom(
      from,
      to,
      args.tokenId,
      args.amount,
      data,
    );
    await tx.wait();
  };

  public transferBatchFrom = async (
    from: string,
    to: string,
    args: IBatchActionArgs[],
    data: BytesLike = [0],
  ) => {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    const tx = await this.contract.safeBatchTransferFrom(
      from,
      to,
      ids,
      amounts,
      data,
    );
    await tx.wait();
  };
}
