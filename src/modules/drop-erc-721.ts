import {
  DropERC721,
  DropERC721__factory,
  IDropERC721,
} from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  NetworkOrSignerOrProvider,
  TransactionResultPromise,
  TransactionResultWithId,
} from "../core/types";
import {
  DropErc721ModuleInput,
  DropErc721ModuleOutput,
  DropErc721ModuleDeploy,
} from "../schema/modules/drop-erc721";
import { SDKOptions, SDKOptionsSchema } from "../schema/sdk-options";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import {
  DropErc721TokenInput,
  DropErc721TokenOutput,
} from "../schema/tokens/drop-erc721";
import { BigNumber, BigNumberish } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import { ClaimCondition } from "../types";
import { z } from "zod";

type NFTMetadataInput = z.input<typeof DropErc721TokenInput>;
type NFTMetadata = z.output<typeof DropErc721TokenOutput>;
type NFTMetadataOwner = { metadata: NFTMetadata; owner: string };

// TODO extract
const DEFAULT_QUERY_ALL_COUNT = 100;
type QueryAllParams = {
  start: number;
  count: number;
};

/**
 * Setup a collection of one-of-one NFTs that are minted as users claim them.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const module = sdk.getDropModule("{{module_address}}");
 * ```
 *
 * @public
 */
export class DropErc721Module {
  static moduleType = "NFTDrop" as const;
  static schema = {
    deploy: DropErc721ModuleDeploy,
    output: DropErc721ModuleOutput,
    input: DropErc721ModuleInput,
    tokenInput: DropErc721TokenInput,
    tokenOutput: DropErc721TokenOutput,
  } as const;

  // this is a type of readoyly Role[], technically, doing it this way makes it work nicely for types
  // **but** we probably want to enforce in an interface somewhere that `static moduleRoles` is a type of Role[]
  public static moduleRoles = ["admin", "minter", "transfer"] as const;

  private contractWrapper;
  private options;
  public metadata;
  public roles;
  public royalty;

  public updateSignerOrProvider;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    options: SDKOptions = {},
  ) {
    try {
      this.options = SDKOptionsSchema.parse(options);
    } catch (optionParseError) {
      console.error(
        "invalid module options object passed, falling back to default options",
        optionParseError,
      );
      this.options = SDKOptionsSchema.parse({});
    }

    this.contractWrapper = new ContractWrapper<DropERC721>(
      network,
      address,
      DropERC721__factory.abi,
      options,
    );
    // expose **only** the updateSignerOrProvider function from the private contractWrapper publicly
    this.updateSignerOrProvider = this.contractWrapper.updateSignerOrProvider;

    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc721Module.schema,
      this.options.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      DropErc721Module.moduleRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * Get a single NFT Metadata
   *
   * @example
   * ```javascript
   * const nft = await module.get("0");
   * console.log(nft);
   * ```
   * @param tokenId - the tokenId of the NFT to retrieve
   * @returns The NFT metadata
   */
  public async get(tokenId: BigNumberish): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId).catch(() => AddressZero),
      this.getTokenMetadata(tokenId),
    ]);
    return { owner, metadata };
  }

  /**
   * Get All NFTs
   *
   * @remarks Get all the data associated with every NFT in this module.
   *
   * @example
   * ```javascript
   * const nfts = await module.getAll();
   * console.log(nfts);
   * ```
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async getAll(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = Math.min(
      (await this.contractWrapper.readContract.nextTokenIdToMint()).toNumber(),
      start + count,
    );
    return await Promise.all(
      Array.from(Array(maxId - start).keys()).map((i) =>
        this.get((start + i).toString()),
      ),
    );
  }

  /**
   * Get All Claimed NFTs
   *
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async getAllClaimed(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = Math.min(
      (await this.contractWrapper.readContract.nextTokenIdToClaim()).toNumber(),
      start + count,
    );
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  /**
   * Get All Unclaimed NFTs
   *
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async getAllUnclaimed(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadata[]> {
    const start = BigNumber.from(queryParams?.start || 0).toNumber();
    const count = BigNumber.from(
      queryParams?.count || DEFAULT_QUERY_ALL_COUNT,
    ).toNumber();
    const maxId = BigNumber.from(
      Math.min(
        (
          await this.contractWrapper.readContract.nextTokenIdToMint()
        ).toNumber(),
        start + count,
      ),
    );
    const unmintedId =
      await this.contractWrapper.readContract.nextTokenIdToClaim();
    return await Promise.all(
      Array.from(Array(maxId.sub(unmintedId).toNumber()).keys()).map((i) =>
        this.getTokenMetadata(unmintedId.add(i).toString()),
      ),
    );
  }

  /**
   * Get Owned NFTs
   *
   * @remarks Get all the data associated with the NFTs owned by a specific wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet to get the NFTs of
   * const address = "{{wallet_address}}";
   * const nfts = await module.getOwned(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the module.
   */
  public async getOwned(_address?: string): Promise<NFTMetadataOwner[]> {
    const address = _address
      ? _address
      : await this.contractWrapper.getSignerAddress();
    const balance = await this.contractWrapper.readContract.balanceOf(address);
    const indices = Array.from(Array(balance.toNumber()).keys());
    const tokenIds = await Promise.all(
      indices.map((i) =>
        this.contractWrapper.readContract.tokenOfOwnerByIndex(address, i),
      ),
    );
    return await Promise.all(
      tokenIds.map((tokenId) => this.get(tokenId.toString())),
    );
  }

  /**
   * Get the current owner of a given NFT within this Drop
   *
   * @param tokenId - the tokenId of the NFT
   * @returns the address of the owner
   */
  public async ownerOf(tokenId: BigNumberish): Promise<string> {
    return await this.contractWrapper.readContract.ownerOf(tokenId);
  }

  // TODO extract all the claim condition logic to its own class

  /**
   * Get the currently active claim condition in this Drop
   *
   * @returns the claim condition metadata
   */
  public async getActiveClaimCondition(): Promise<ClaimCondition> {
    const index =
      await this.contractWrapper.readContract.getIndexOfActiveCondition();
    const mc = await this.contractWrapper.readContract.getClaimConditionAtIndex(
      index,
    );
    return await this.transformResultToClaimCondition(mc);
  }

  /**
   * Get all the claim conditions associated with this Drop
   *
   * @returns the claim conditions metadata
   */
  public async getAllClaimConditions(): Promise<ClaimCondition[]> {
    const claimCondition =
      await this.contractWrapper.readContract.claimConditions();
    const count = claimCondition.totalConditionCount.toNumber();
    const conditions = [];
    for (let i = 0; i < count; i++) {
      conditions.push(
        await this.contractWrapper.readContract.getClaimConditionAtIndex(i),
      );
    }
    return Promise.all(
      conditions.map((c) => this.transformResultToClaimCondition(c)),
    );
  }

  /**
   * Get the total supply for this Drop.
   *
   * @returns the total supply
   */
  public async totalSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.nextTokenIdToMint();
  }

  /**
   * Get the unclaimed supply for this Drop.
   *
   * @returns the unclaimed supply
   */
  public async totalUnclaimedSupply(): Promise<BigNumber> {
    return (await this.contractWrapper.readContract.nextTokenIdToMint()).sub(
      await this.totalClaimedSupply(),
    );
  }

  /**
   * Get the claimed supply for this Drop.
   *
   * @returns the claimed supply
   */
  public async totalClaimedSupply(): Promise<BigNumber> {
    return await this.contractWrapper.readContract.nextTokenIdToClaim();
  }

  /**
   * Get NFT Balance
   *
   * @remarks Get a wallets NFT balance (number of NFTs in this module owned by the wallet).
   *
   * @example
   * ```javascript
   * // Address of the wallet to check NFT balance
   * const address = "{{wallet_address}}";
   *
   * const balance = await module.balanceOf(address);
   * console.log(balance);
   * ```
   */
  public async balanceOf(address: string): Promise<BigNumber> {
    return await this.contractWrapper.readContract.balanceOf(address);
  }

  /**
   * Get NFT Balance for the currently connected wallet
   */
  public async balance(): Promise<BigNumber> {
    return await this.balanceOf(await this.contractWrapper.getSignerAddress());
  }

  /**
   * Get whether this wallet has approved transfers from the given operator
   * @param address - the wallet address
   * @param operator - the operator address
   */
  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.contractWrapper.readContract.isApprovedForAll(
      address,
      operator,
    );
  }

  /**
   * Get the primary sale recipient.
   * @returns the wallet address.
   */
  public async getPrimarySaleRecipient(): Promise<string> {
    return await this.contractWrapper.readContract.primarySaleRecipient();
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Create batch allows you to create a batch of tokens
   * in one transaction. This function can only be called
   * once per module at the moment.
   *
   * @beta
   *
   * @example
   * ```javascript
   * // The array of NFT metadata you want to create
   * const nftMetadatasToCreate = [{ name: ..., description: ...}, { name: ... }, ...];
   *
   * const results = await module.createBatch(nftMetadatasToCreate); // uploads and creates the NFTs on chain
   * const receipt = results[0].receipt; // same transaction receipt for all created NFTs
   * const tokenIds = results.map((result) => result.id); // all the token ids created
   * const firstTokenId = results[0].id; // token id of the first created NFT
   * const firstNFT = await results[0].data(); // (optional) fetch details of the first created NFT
   * ```
   *
   * @param metadatas - The metadata to include in the batch.
   */
  public async createBatch(
    metadatas: NFTMetadataInput[],
  ): Promise<TransactionResultWithId<NFTMetadata>[]> {
    const startFileNumber =
      await this.contractWrapper.readContract.nextTokenIdToMint();
    const { baseUri } = await this.options.storage.uploadMetadataBatch(
      metadatas,
      this.contractWrapper.readContract.address,
      startFileNumber.toNumber(),
    );
    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      metadatas.length,
      baseUri,
    ]);
    // TODO figure out how to type the return types of parseEventLogs
    const event = this.contractWrapper.parseEventLogs(
      "LazyMintedTokens",
      receipt?.logs,
    );
    const [startingIndex, endingIndex]: BigNumber[] = event;
    const results = [];
    for (let id = startingIndex; id.lte(endingIndex); id = id.add(1)) {
      results.push({
        id,
        receipt,
        data: () => this.getTokenMetadata(id),
      });
    }
    return results;
  }

  /**
   * Transfer NFT
   *
   * @remarks Transfer an NFT from the connected wallet to another wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to send the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // The token ID of the NFT you want to send
   * const tokenId = "0";
   *
   * await module.transfer(toAddress, tokenId);
   * ```
   */
  public async transfer(to: string, tokenId: string): TransactionResultPromise {
    const from = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "safeTransferFrom(address,address,uint256)",
        [from, to, tokenId],
      ),
    };
  }

  /**
   * Approve or remove operator as an operator for the caller. Operators can call transferFrom or safeTransferFrom for any token owned by the caller.
   * @param operator - the operator's address
   * @param approved - whether to approve or remove
   */
  public async setApproval(
    operator: string,
    approved = true,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("setApprovalForAll", [
        operator,
        approved,
      ]),
    };
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  private async getTokenMetadata(tokenId: BigNumberish): Promise<NFTMetadata> {
    const tokenUri = await this.contractWrapper.readContract.tokenURI(tokenId);
    return DropErc721TokenOutput.parse(
      await this.options.storage.get(tokenUri),
    );
  }

  private async transformResultToClaimCondition(
    pm: IDropERC721.ClaimConditionStructOutput,
  ): Promise<ClaimCondition> {
    // TODO have a dedicated class for currency manipulation that takes in a contractWrapper?
    // const cv = await getCurrencyValue(
    //   this.providerOrSigner,
    //   pm.currency,
    //   pm.pricePerToken,
    // );
    const cv = "";
    return {
      startTimestamp: new Date(
        BigNumber.from(pm.startTimestamp).toNumber() * 1000,
      ),
      maxMintSupply: pm.maxClaimableSupply.toString(),
      currentMintSupply: pm.supplyClaimed.toString(),
      availableSupply: BigNumber.from(pm.maxClaimableSupply)
        .sub(pm.supplyClaimed)
        .toString(),
      quantityLimitPerTransaction: pm.quantityLimitPerTransaction.toString(),
      waitTimeSecondsLimitPerTransaction:
        pm.waitTimeInSecondsBetweenClaims.toString(),
      price: BigNumber.from(pm.pricePerToken),
      pricePerToken: BigNumber.from(pm.pricePerToken),
      currency: pm.currency,
      currencyContract: pm.currency,
      currencyMetadata: cv,
      merkleRoot: pm.merkleRoot,
    };
  }
}

/**
 *  JUST TS SANITY CHECK BELOW
 */

// (async () => {
//   // MODULE
//   const module = new DropErc721Module("1", "0x0");

//   const metdata = await module.metadata.get();

//   const txResult = await module.metadata.set({ name: "foo" });
//   const metadata = await txResult.data();

//   // TOKEN
//   const data = await module.getAll();
//   const owner = data[0].owner;
//   const tokenMetadata = data[0].metadata;

//   const d = await module.createBatch([]);
//   const meta = await d[0].data();
// })();
