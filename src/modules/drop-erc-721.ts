import { ContractRoles } from "../core/classes/contract-roles";
import { DropERC721, DropERC721__factory } from "@3rdweb/contracts";
import { hexZeroPad } from "@ethersproject/bytes";
import { BigNumber, BigNumberish, BytesLike, CallOverrides } from "ethers";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { IStorage } from "../core/interfaces/IStorage";
import {
  NetworkOrSignerOrProvider,
  TransactionResultWithId,
} from "../core/types";
import { DropErc721ModuleSchema } from "../schema/modules/drop-erc721";
import { SDKOptions } from "../schema/sdk-options";
import {
  NFTMetadata,
  NFTMetadataInput,
  NFTMetadataOwner,
} from "../schema/tokens/common";
import { DEFAULT_QUERY_ALL_COUNT, QueryAllParams } from "../types/QueryParams";
import { DropErc721ClaimConditions } from "../core/classes/drop-erc721-claim-conditions";
import { Erc721 } from "../core/classes/erc-721";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import { prepareClaim } from "../common/claim-conditions";

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
export class DropErc721Module extends Erc721<DropERC721> {
  static moduleType = "DropERC721" as const;
  static schema = DropErc721ModuleSchema;
  static moduleRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = DropERC721__factory;

  public metadata: ContractMetadata<DropERC721, typeof DropErc721Module.schema>;
  public roles: ContractRoles<
    DropERC721,
    typeof DropErc721Module.moduleRoles[number]
  >;
  public royalty: ContractRoyalty<DropERC721, typeof DropErc721Module.schema>;
  public primarySales: ContractPrimarySale<DropERC721>;
  public claimConditions: DropErc721ClaimConditions;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<DropERC721>(
      network,
      address,
      DropErc721Module.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc721ModuleSchema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      DropErc721Module.moduleRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySales = new ContractPrimarySale(this.contractWrapper);
    this.claimConditions = new DropErc721ClaimConditions(
      this.contractWrapper,
      this.metadata,
      this.storage,
    );
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

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
    const batch = await this.storage.uploadMetadataBatch(
      metadatas,
      startFileNumber.toNumber(),
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
    );
    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      batch.metadataUris.length,
      batch.baseUri,
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
   * Claim NFTs to a specific Wallet
   *
   * @remarks Let the a specified wallet claim NFTs.
   *
   * @example
   * ```javascript
   * const address = "{{wallet_address}}"; // Address of the wallet you want to claim the NFTs
   * const quantity = 1; // Quantity of the tokens you want to claim
   *
   * await module.claimTo(address, quantity);
   * ```
   *
   * @param destinationAddress - Address you want to send the token to
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - an array of results containing the id of the token claimed, the transaction receipt and a promise to optionally fetch the nft metadata
   */
  public async claimTo(
    destinationAddress: string,
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    const claimData = await this.prepareClaim(quantity, proofs);
    const receipt = await this.contractWrapper.sendTransaction(
      "claim",
      [destinationAddress, quantity, claimData.proofs],
      claimData.overrides,
    );
    const event = this.contractWrapper.parseEventLogs(
      "ClaimedTokens",
      receipt?.logs,
    );
    const startingIndex: BigNumber = event.startTokenId;
    const endingIndex = startingIndex.add(quantity);
    const results = [];
    for (let id = startingIndex; id.lt(endingIndex); id = id.add(1)) {
      results.push({
        id,
        receipt,
        data: () => this.get(id),
      });
    }
    return results;
  }

  /**
   * Claim NFTs to your connected wallet.
   *
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - an array of results containing the id of the token claimed, the transaction receipt and a promise to optionally fetch the nft metadata
   */
  public async claim(
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this.claimTo(
      await this.contractWrapper.getSignerAddress(),
      quantity,
      proofs,
    );
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * Returns proofs and the overrides required for the transaction.
   *
   * @returns - `overrides` and `proofs` as an object.
   */
  private async prepareClaim(
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<{
    overrides: CallOverrides;
    proofs: BytesLike[];
  }> {
    return prepareClaim(
      quantity,
      await this.claimConditions.getActive(),
      (await this.metadata.get()).merkle,
      this.contractWrapper,
      this.storage,
      proofs,
    );
  }
}

/**
 *  JUST TS SANITY CHECK BELOW
 */

// (async () => {
//   // MODULE
//   const module = new DropErc721Module("1", "0x0", new IpfsStorage(""));

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
