import { UpdateableNetwork } from "../core/interfaces/contract";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  ContractInterceptor,
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { SDKOptions } from "../schema/sdk-options";
import {
  IERC1155__factory,
  IERC20__factory,
  Pack as PackContract,
  Pack__factory,
} from "@thirdweb-dev/contracts";
import { PacksContractSchema } from "../schema/contracts/packs";
import { ContractRoles } from "../core/classes/contract-roles";
import { NFTMetadata } from "../schema/tokens/common";
import {
  PackAddedEvent,
  PackOpenRequestedEvent,
} from "@thirdweb-dev/contracts/dist/Pack";
import { BigNumber, BigNumberish, BytesLike, ethers } from "ethers";
import { fetchTokenMetadataForContract } from "../common/nft";
import {
  IPackBatchArgs,
  IPackCreateArgs,
  PackMetadata,
  PackMetadataWithBalance,
  PackNFTMetadata,
} from "../types/packs";
import { NotFoundError } from "../common";
import { CurrencyValue } from "../types/currency";
import { fetchCurrencyValue } from "../common/currency";
import { ChainlinkVrf } from "../constants/chainlink";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { GasCostEstimator } from "../core/classes";
import { ContractEvents } from "../core/classes/contract-events";

/**
 * Create lootboxes of NFTs with rarity based open mechanics.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getPack("{{contract_address}}");
 * ```
 *
 * @public
 */
export class Pack implements UpdateableNetwork {
  static contractType = "pack" as const;
  static contractRoles = ["admin", "minter", "pauser", "transfer"] as const;
  static contractFactory = Pack__factory;
  /**
   * @internal
   */
  static schema = PacksContractSchema;

  private contractWrapper: ContractWrapper<PackContract>;
  private storage: IStorage;

  public metadata: ContractMetadata<PackContract, typeof Pack.schema>;
  public roles: ContractRoles<PackContract, typeof Pack.contractRoles[number]>;
  public encoder: ContractEncoder<PackContract>;
  public events: ContractEvents<PackContract>;
  public estimator: GasCostEstimator<PackContract>;
  /**
   * Configure royalties
   * @remarks Set your own royalties for the entire contract or per pack
   * @example
   * ```javascript
   * // royalties on the whole contract
   * contract.royalty.setDefaultRoyaltyInfo({
   *   seller_fee_basis_points: 100, // 1%
   *   fee_recipient: "0x..."
   * });
   * // override royalty for a particular pack
   * contract.royalty.setTokenRoyaltyInfo(packId, {
   *   seller_fee_basis_points: 500, // 5%
   *   fee_recipient: "0x..."
   * });
   * ```
   */
  public royalty: ContractRoyalty<PackContract, typeof Pack.schema>;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<PackContract>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<PackContract>(
      network,
      address,
      Pack.contractFactory.abi,
      options,
    ),
  ) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      Pack.schema,
      this.storage,
    );
    this.roles = new ContractRoles(this.contractWrapper, Pack.contractRoles);
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
  }

  onNetworkUpdated(network: NetworkOrSignerOrProvider) {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * Get a pack by id
   * @param packId - the id of the pack to fetch
   * @returns the pack metadata
   */
  public async get(packId: BigNumberish): Promise<PackMetadata> {
    const [meta, state, supply] = await Promise.all([
      fetchTokenMetadataForContract(
        this.getAddress(),
        this.contractWrapper.getProvider(),
        packId,
        this.storage,
      ),
      this.contractWrapper.readContract.packs(packId),
      this.contractWrapper.readContract
        .totalSupply(packId)
        .catch(() => BigNumber.from("0")),
    ]);
    return {
      id: BigNumber.from(packId).toString(),
      metadata: meta,
      creator: state.creator,
      currentSupply: supply,
      openStart: state.openStart.gt(0)
        ? new Date(state.openStart.toNumber() * 1000)
        : null,
    };
  }

  /**
   * Get Pack Data
   *
   * @remarks Get data associated with every pack in this contract.
   *
   * @example
   * ```javascript
   * const packs = await contract.getAll();
   * console.log(packs);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async getAll(): Promise<PackMetadata[]> {
    const maxId = (
      await this.contractWrapper.readContract.nextTokenId()
    ).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  /**
   * Get Pack Reward Data
   *
   * @remarks Get data associated with the rewards inside a specified pack
   *
   * @example
   * ```javascript
   * // The pack ID of the pack whos rewards you want to get
   * const packId = 0;
   *
   * const nfts = await contract.getNFTs(packId);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async getNFTs(packId: string): Promise<PackNFTMetadata[]> {
    const packReward =
      await this.contractWrapper.readContract.getPackWithRewards(packId);
    if (!packReward.source) {
      throw new NotFoundError();
    }
    const rewards = await Promise.all(
      packReward.tokenIds.map((tokenId) =>
        fetchTokenMetadataForContract(
          packReward.source,
          this.contractWrapper.getProvider(),
          tokenId.toString(),
          this.storage,
        ),
      ),
    );
    return rewards.map((reward, i) => ({
      supply: packReward.amountsPacked[i],
      metadata: reward,
    }));
  }

  /**
   * Get Pack Balance
   *
   * @remarks Get a wallets pack balance (number of a specific packs in this contract owned by the wallet).
   *
   * @example
   * ```javascript
   * // Address of the wallet to check pack balance
   * const address = "{{wallet_address}}";
   * // The token ID of the pack you want to check the wallets balance of
   * const tokenId = "0"
   *
   * const balance = await contract.balanceOf(address, tokenId);
   * console.log(balance);
   * ```
   */
  public async balanceOf(address: string, tokenId: string): Promise<BigNumber> {
    return await this.contractWrapper.readContract.balanceOf(address, tokenId);
  }

  public async balance(tokenId: string): Promise<BigNumber> {
    return await this.balanceOf(
      await this.contractWrapper.getSignerAddress(),
      tokenId,
    );
  }

  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.contractWrapper.readContract.isApprovedForAll(
      address,
      operator,
    );
  }

  public async getLinkBalance(): Promise<CurrencyValue> {
    const chainId = await this.contractWrapper.getChainID();
    const chainlink = ChainlinkVrf[chainId];
    const erc20 = IERC20__factory.connect(
      chainlink.linkTokenAddress,
      this.contractWrapper.getProvider(),
    );
    return await fetchCurrencyValue(
      this.contractWrapper.getProvider(),
      chainlink.linkTokenAddress,
      await erc20.balanceOf(this.getAddress()),
    );
  }

  /**
   * `getOwned` is a convenience method for getting all owned tokens
   * for a particular wallet.
   *
   * @param _address - The address to check for token ownership
   * @returns An array of PackMetadataWithBalance objects that are owned by the address
   */
  public async getOwned(_address?: string): Promise<PackMetadataWithBalance[]> {
    const address = _address
      ? _address
      : await this.contractWrapper.getSignerAddress();
    const maxId = await this.contractWrapper.readContract.nextTokenId();
    const balances = await this.contractWrapper.readContract.balanceOfBatch(
      Array(maxId.toNumber()).fill(address),
      Array.from(Array(maxId.toNumber()).keys()),
    );

    const ownedBalances = balances
      .map((b, i) => {
        return {
          tokenId: i,
          balance: b,
        };
      })
      .filter((b) => b.balance.gt(0));
    return await Promise.all(
      ownedBalances.map(async ({ tokenId, balance }) => {
        const token = await this.get(tokenId.toString());
        return { ...token, ownedByAddress: balance };
      }),
    );
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Open Pack
   *
   * @remarks Open a pack to burn it and obtain the reward asset inside.
   *
   * @example
   * ```javascript
   * // The pack ID of the asset you want to buy
   * const packId = "0";
   * const tx = await contract.open(packId);
   * const receipt = tx.receipt; // the transaction receipt
   * const packId = tx.id; // the id of the pack that was opened
   * const rewards = tx.data(); // the contents of the opened pack
   * ```
   */
  public async open(
    packId: string,
  ): Promise<TransactionResultWithId<NFTMetadata>[]> {
    const receipt = await this.contractWrapper.sendTransaction("openPack", [
      packId,
    ]);
    const logs = this.contractWrapper.parseLogs<PackOpenRequestedEvent>(
      "PackOpenRequested",
      receipt?.logs,
    );
    if (logs.length === 0) {
      throw new Error("Failed to open pack");
    }
    const event = logs[0];

    const requestId = event.args.requestId;
    const opener = event.args.opener;

    // TODO type this
    const fulfillEvent: any = await new Promise((resolve) => {
      this.contractWrapper.readContract.once(
        this.contractWrapper.readContract.filters.PackOpenFulfilled(
          null,
          opener,
        ),
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

    const { rewardIds, rewardContract } = fulfillEvent;

    return rewardIds.map((rewardId: BigNumber) => ({
      id: packId,
      receipt,
      data: () =>
        fetchTokenMetadataForContract(
          rewardContract,
          this.contractWrapper.getProvider(),
          rewardId.toString(),
          this.storage,
        ),
    }));
  }

  /**
   * Create Pack
   *
   * @remarks Create a new pack with its own rewards.
   *
   * @example
   * ```javascript
   * // Data to create the pack
   * const pack = {
   *   // The address of the contract that holds the rewards you want to include
   *   assetContract: "0x...",
   *   // The metadata of the pack
   *   metadata: {
   *     name: "Cool Pack",
   *     description: "This is a cool pack",
   *     // This can be an image url or image file
   *     image: readFileSync("path/to/image.png"),
   *   },
   *   // The NFTs you want to include in the pack
   *   assets: [
   *     {
   *       tokenId: 0, // The token ID of the asset you want to add
   *       amount: 1, // The amount of the asset you want to add
   *     }, {
   *       tokenId: 1,
   *       amount: 1,
   *     }
   *   ],
   * };
   *
   * await contract.create(pack);
   * ```
   *
   * @param args - Args for the pack creation
   * @returns - The newly created pack metadata
   */
  public async create(
    args: IPackCreateArgs,
  ): Promise<TransactionResultWithId<PackMetadata>> {
    const asset = IERC1155__factory.connect(
      args.assetContract,
      this.contractWrapper.getSigner() || this.contractWrapper.getProvider(),
    );

    const from = await this.contractWrapper.getSignerAddress();
    const ids = args.assets.map((a) => a.tokenId);
    const amounts = args.assets.map((a) => a.amount);
    const uri = await this.storage.uploadMetadata(args.metadata);

    const packParams = ethers.utils.defaultAbiCoder.encode(
      ["string", "uint256", "uint256"],
      [uri, args.secondsUntilOpenStart || 0, args.rewardsPerOpen || 1],
    );

    // TODO: make it gasless
    const tx = await asset.safeBatchTransferFrom(
      from,
      this.getAddress(),
      ids,
      amounts,
      packParams,
      await this.contractWrapper.getCallOverrides(),
    );

    const receipt = await tx.wait();
    const log = this.contractWrapper.parseLogs<PackAddedEvent>(
      "PackAdded",
      receipt.logs,
    );
    if (log.length === 0) {
      throw new Error("PackCreated event not found");
    }
    const packId = log[0].args.packId;
    return { id: packId, receipt, data: () => this.get(packId.toString()) };
  }

  /**
   * Transfer Pack
   *
   * @remarks Transfer a pack from the connected wallet to another wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to send the pack to
   * const toAddress = "0x...";
   *
   * // The token ID of the pack you want to send
   * const tokenId = "0";
   *
   * // The number of packs you want to send
   * const amount = 1;
   *
   * await contract.transfer(toAddress, tokenId, amount);
   * ```
   */
  public async transfer(
    to: string,
    tokenId: string,
    amount: BigNumber,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("safeTransferFrom", [
        await this.contractWrapper.getSignerAddress(),
        to,
        tokenId,
        amount,
        [0],
      ]),
    };
  }

  public async transferFrom(
    from: string,
    to: string,
    args: IPackBatchArgs,
    data: BytesLike = [0],
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("safeTransferFrom", [
        from,
        to,
        args.tokenId,
        args.amount,
        data,
      ]),
    };
  }

  public async transferBatchFrom(
    from: string,
    to: string,
    args: IPackBatchArgs[],
    data: BytesLike = [0],
  ): Promise<TransactionResult> {
    const ids = args.map((a) => a.tokenId);
    const amounts = args.map((a) => a.amount);
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "safeBatchTransferFrom",
        [from, to, ids, amounts, data],
      ),
    };
  }

  public async setApproval(
    operator: string,
    approved = true,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("setApprovalForAll", [
        operator,
        approved,
      ]),
    };
  }

  public async depositLink(amount: BigNumberish): Promise<TransactionResult> {
    const chainId = await this.contractWrapper.getChainID();
    const chainlink = ChainlinkVrf[chainId];
    const erc20 = IERC20__factory.connect(
      chainlink.linkTokenAddress,
      this.contractWrapper.getProvider(),
    );
    // TODO: make it gasless
    const tx = await erc20.transfer(
      this.getAddress(),
      amount,
      await this.contractWrapper.getCallOverrides(),
    );
    return { receipt: await tx.wait() };
  }

  // TODO new withdraw LINK function in contract
  // public async withdrawLink(to: string, amount: BigNumberish) {
  //   const chainId = await this.contractWrapper.getChainID();
  //   const chainlink = ChainlinkVrf[chainId];
  //   await this.contractWrapper.sendTransaction("transferERC20", [
  //     chainlink.linkTokenAddress,
  //     to,
  //     amount,
  //   ]);
  // }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/
}
