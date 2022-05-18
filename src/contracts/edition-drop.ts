import { Erc1155 } from "../core/classes/erc-1155";
import { DropERC1155 } from "contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import {
  Erc1155Enumerable,
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  CommonNFTInput,
  NFTMetadata,
  NFTMetadataInput,
} from "../schema/tokens/common";
import { BigNumber, BigNumberish, BytesLike, constants, utils } from "ethers";
import { prepareClaim } from "../common/claim-conditions";
import { DropErc1155ClaimConditions } from "../core/classes/drop-erc1155-claim-conditions";
import { DropErc1155ContractSchema } from "../schema/contracts/drop-erc1155";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { GasCostEstimator } from "../core/classes/gas-cost-estimator";
import { ClaimVerification, QueryAllParams } from "../types";
import { DropErc1155History } from "../core/classes/drop-erc1155-history";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";
import { ContractInterceptor } from "../core/classes/contract-interceptor";
import { TokensLazyMintedEvent } from "contracts/DropERC1155";
import { getRoleHash } from "../common";

import { EditionMetadata, EditionMetadataOwner } from "../schema";
import { ContractAnalytics } from "../core/classes/contract-analytics";

/**
 * Setup a collection of NFTs with a customizable number of each NFT that are minted as users claim them.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getEditionDrop("{{contract_address}}");
 * ```
 *
 * @public
 */
export class EditionDrop extends Erc1155<DropERC1155> {
  static contractType = "edition-drop" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractAbi = require("../../abis/DropERC1155.json");
  /**
   * @internal
   */
  static schema = DropErc1155ContractSchema;

  private _query = this.query as Erc1155Enumerable;

  public primarySale: ContractPrimarySale<DropERC1155>;
  public platformFee: ContractPlatformFee<DropERC1155>;
  public encoder: ContractEncoder<DropERC1155>;
  public estimator: GasCostEstimator<DropERC1155>;
  public events: ContractEvents<DropERC1155>;
  public metadata: ContractMetadata<DropERC1155, typeof EditionDrop.schema>;
  /**
   * @internal
   */
  public analytics: ContractAnalytics<DropERC1155>;
  public roles: ContractRoles<
    DropERC1155,
    typeof EditionDrop.contractRoles[number]
  >;
  /**
   * Configure royalties
   * @remarks Set your own royalties for the entire contract or per token
   * @example
   * ```javascript
   * // royalties on the whole contract
   * contract.royalty.setDefaultRoyaltyInfo({
   *   seller_fee_basis_points: 100, // 1%
   *   fee_recipient: "0x..."
   * });
   * // override royalty for a particular token
   * contract.royalty.setTokenRoyaltyInfo(tokenId, {
   *   seller_fee_basis_points: 500, // 5%
   *   fee_recipient: "0x..."
   * });
   * ```
   */
  public royalty: ContractRoyalty<DropERC1155, typeof EditionDrop.schema>;
  /**
   * Configure claim conditions for each NFT
   * @remarks Define who can claim each NFT in the edition, when and how many.
   * @example
   * ```javascript
   * const presaleStartTime = new Date();
   * const publicSaleStartTime = new Date(Date.now() + 60 * 60 * 24 * 1000);
   * const claimConditions = [
   *   {
   *     startTime: presaleStartTime, // start the presale now
   *     maxQuantity: 2, // limit how many mints for this presale
   *     price: 0.01, // presale price
   *     snapshot: ['0x...', '0x...'], // limit minting to only certain addresses
   *   },
   *   {
   *     startTime: publicSaleStartTime, // 24h after presale, start public sale
   *     price: 0.08, // public sale price
   *   }
   * ]);
   *
   * const tokenId = 0; // the id of the NFT to set claim conditions on
   * await contract.claimConditions.set(tokenId, claimConditions);
   * ```
   */
  public claimConditions: DropErc1155ClaimConditions;
  public history: DropErc1155History;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<DropERC1155>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<DropERC1155>(
      network,
      address,
      EditionDrop.contractAbi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      EditionDrop.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      EditionDrop.contractRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySale = new ContractPrimarySale(this.contractWrapper);
    this.claimConditions = new DropErc1155ClaimConditions(
      this.contractWrapper,
      this.metadata,
      this.storage,
    );
    this.analytics = new ContractAnalytics(this.contractWrapper);
    this.history = new DropErc1155History(this.analytics);
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.platformFee = new ContractPlatformFee(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  // TODO getAllClaimerAddresses() - should be done via an indexer

  /**
   * Get All Minted NFTs
   *
   * @remarks Get all the data associated with every NFT in this contract.
   *
   * By default, returns the first 100 NFTs, use queryParams to fetch more.
   *
   * @example
   * ```javascript
   * const nfts = await contract.getAll();
   * ```
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async getAll(
    queryParams?: QueryAllParams,
  ): Promise<EditionMetadata[]> {
    return this._query.all(queryParams);
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
   * const nfts = await contract.getOwned(address);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async getOwned(
    walletAddress?: string,
  ): Promise<EditionMetadataOwner[]> {
    return this._query.owned(walletAddress);
  }

  /**
   * Get the number of NFTs minted
   * @returns the total number of NFTs minted in this contract
   * @public
   */
  public async getTotalCount(): Promise<BigNumber> {
    return this._query.getTotalCount();
  }

  /**
   * Get whether users can transfer NFTs from this contract
   */
  public async isTransferRestricted(): Promise<boolean> {
    const anyoneCanTransfer = await this.contractWrapper.readContract.hasRole(
      getRoleHash("transfer"),
      constants.AddressZero,
    );
    return !anyoneCanTransfer;
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Create a batch of NFTs to be claimed in the future
   *
   * @remarks Create batch allows you to create a batch of many NFTs in one transaction.
   *
   * @example
   * ```javascript
   * // Custom metadata of the NFTs to create
   * const metadatas = [{
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }, {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"),
   * }];
   *
   * const results = await contract.createBatch(metadatas); // uploads and creates the NFTs on chain
   * const firstTokenId = results[0].id; // token id of the first created NFT
   * const firstNFT = await results[0].data(); // (optional) fetch details of the first created NFT
   * ```
   */
  public async createBatch(
    metadatas: NFTMetadataInput[],
  ): Promise<TransactionResultWithId<NFTMetadata>[]> {
    const startFileNumber =
      await this.contractWrapper.readContract.nextTokenIdToMint();
    const batch = await this.storage.uploadMetadataBatch(
      metadatas.map((m) => CommonNFTInput.parse(m)),
      startFileNumber.toNumber(),
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
    );
    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      batch.metadataUris.length,
      `${batch.baseUri.endsWith("/") ? batch.baseUri : `${batch.baseUri}/`}`,
    ]);
    const event = this.contractWrapper.parseLogs<TokensLazyMintedEvent>(
      "TokensLazyMinted",
      receipt?.logs,
    );
    const startingIndex = event[0].args.startTokenId;
    const endingIndex = event[0].args.endTokenId;
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
   * @remarks Let the specified wallet claim NFTs.
   *
   * @example
   * ```javascript
   * const address = "{{wallet_address}}"; // address of the wallet you want to claim the NFTs
   * const tokenId = 0; // the id of the NFT you want to claim
   * const quantity = 1; // how many NFTs you want to claim
   *
   * const tx = await contract.claimTo(address, tokenId, quantity);
   * const receipt = tx.receipt; // the transaction receipt
   * const claimedTokenId = tx.id; // the id of the NFT claimed
   * const claimedNFT = await tx.data(); // (optional) get the claimed NFT metadata
   * ```
   *
   * @param destinationAddress - Address you want to send the token to
   * @param tokenId - Id of the token you want to claim
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - Receipt for the transaction
   */
  public async claimTo(
    destinationAddress: string,
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<TransactionResult> {
    const claimVerification = await this.prepareClaim(
      tokenId,
      quantity,
      proofs,
    );
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "claim",
        [
          destinationAddress,
          tokenId,
          quantity,
          claimVerification.currencyAddress,
          claimVerification.price,
          claimVerification.proofs,
          claimVerification.maxQuantityPerTransaction,
        ],
        claimVerification.overrides,
      ),
    };
  }

  /**
   * Claim a token to the connected wallet
   *
   * @remarks See {@link EditionDrop.claimTo}
   *
   * @param tokenId - Id of the token you want to claim
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - Receipt for the transaction
   */
  public async claim(
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<TransactionResult> {
    const address = await this.contractWrapper.getSignerAddress();
    return this.claimTo(address, tokenId, quantity, proofs);
  }

  /**
   * Burn a specified amount of a NFT
   *
   * @param tokenId - the token Id to burn
   * @param amount - amount to burn
   *
   * @example
   * ```javascript
   * const result = await contract.burn(tokenId, amount);
   * ```
   */
  public async burn(
    tokenId: BigNumberish,
    amount: BigNumberish,
  ): Promise<TransactionResult> {
    const account = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [
        account,
        tokenId,
        amount,
      ]),
    };
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
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<ClaimVerification> {
    return prepareClaim(
      quantity,
      await this.claimConditions.getActive(tokenId),
      (await this.metadata.get()).merkle,
      0,
      this.contractWrapper,
      this.storage,
      proofs,
    );
  }
}
