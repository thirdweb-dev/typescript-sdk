import {
  ERC165__factory,
  IERC1155,
  IERC1155__factory,
  IERC721,
  IERC721__factory,
  IMarketplace,
  Marketplace as MarketplaceContract,
  Marketplace__factory,
} from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractEncoder } from "../core/classes/contract-encoder";
import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { UpdateableNetwork } from "../core/interfaces/contract";
import { MarketplaceContractSchema } from "../schema/contracts/marketplace";
import {
  AuctionListing,
  DirectListing,
  NewAuctionListing,
  NewDirectListing,
  Offer,
} from "../types/marketplace";
import { ListingType } from "../enums";
import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  fetchCurrencyMetadata,
  fetchCurrencyValue,
  isNativeToken,
  normalizePriceValue,
  setErc20Allowance,
} from "../common/currency";
import invariant from "tiny-invariant";
import { MAX_BPS } from "../schema/shared";
import {
  AuctionAlreadyStartedError,
  AuctionHasNotEndedError,
  ListingNotFoundError,
  WrongListingTypeError,
} from "../common";
import { fetchTokenMetadataForContract } from "../common/nft";
import {
  InterfaceId_IERC1155,
  InterfaceId_IERC721,
} from "../constants/contract";
import { isAddress } from "ethers/lib/utils";
import { AddressZero } from "@ethersproject/constants";
import { MarketplaceFilter } from "../types/marketplace/MarketPlaceFilter";
import ListingParametersStruct = IMarketplace.ListingParametersStruct;
import ListingStruct = IMarketplace.ListingStruct;
import { Price } from "../types/currency";
import { getRoleHash } from "../common/role";

/**
 * Create your own whitelabel marketplace that enables users to buy and sell any digital assets.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const marketplace = sdk.getMarketplace("{{contract_address}}");
 * ```
 *
 * @public
 */
export class Marketplace implements UpdateableNetwork {
  static contractType = "marketplace" as const;
  static contractRoles = ["admin", "lister"] as const;
  static contractFactory = Marketplace__factory;
  /**
   * @internal
   */
  static schema = MarketplaceContractSchema;

  private contractWrapper: ContractWrapper<MarketplaceContract>;
  private storage: IStorage;

  public metadata: ContractMetadata<
    MarketplaceContract,
    typeof Marketplace.schema
  >;
  public roles: ContractRoles<
    MarketplaceContract,
    typeof Marketplace.contractRoles[number]
  >;
  public encoder: ContractEncoder<MarketplaceContract>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<MarketplaceContract>(
      network,
      address,
      Marketplace.contractFactory.abi,
      options,
    ),
  ) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      Marketplace.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      Marketplace.contractRoles,
    );
    this.encoder = new ContractEncoder(this.contractWrapper);
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
   * Get a direct listing by id
   *
   * @param listingId the listind Id
   * @returns the Direct listing object
   */
  public async getDirectListing(
    listingId: BigNumberish,
  ): Promise<DirectListing> {
    const listing = await this.contractWrapper.readContract.listings(listingId);

    if (listing.assetContract === AddressZero) {
      throw new ListingNotFoundError(this.getAddress(), listingId.toString());
    }

    if (listing.listingType !== ListingType.Direct) {
      throw new WrongListingTypeError(
        this.getAddress(),
        listingId.toString(),
        "Auction",
        "Direct",
      );
    }

    return await this.mapDirectListing(listing);
  }

  /**
   * Get an Auction listing by id
   *
   * @param listingId the listing Id
   * @returns the Auction listing object
   */
  public async getAuctionListing(
    listingId: BigNumberish,
  ): Promise<AuctionListing> {
    const listing = await this.contractWrapper.readContract.listings(listingId);

    if (listing.listingId.toString() !== listingId.toString()) {
      throw new ListingNotFoundError(this.getAddress(), listingId.toString());
    }

    if (listing.listingType !== ListingType.Auction) {
      throw new WrongListingTypeError(
        this.getAddress(),
        listingId.toString(),
        "Direct",
        "Auction",
      );
    }
    return await this.mapAuctionListing(listing);
  }

  /**
   * Get the active offer on a listing
   * @param listingId - the listing id
   * @param address - the address that made the offer
   */
  public async getActiveOffer(
    listingId: BigNumberish,
    address: string,
  ): Promise<Offer | undefined> {
    await this.validateDirectListing(BigNumber.from(listingId));
    invariant(isAddress(address), "Address must be a valid address");
    const offers = await this.contractWrapper.readContract.offers(
      listingId,
      address,
    );
    if (offers.offeror === AddressZero) {
      return undefined;
    }
    return await this.mapOffer(BigNumber.from(listingId), offers);
  }

  /**
   * Get Highest Bid
   *
   * @remarks Get the current highest bid of an active auction.
   *
   * @example
   * ```javascript
   * // The listing ID of the auction that closed
   * const listingId = 0;
   *
   * contract
   *   .getWinningBid(listingId)
   *   .then((offer) => console.log(offer))
   *   .catch((err) => console.error(err));
   * ```
   */
  public async getWinningBid(
    listingId: BigNumberish,
  ): Promise<Offer | undefined> {
    await this.validateAuctionListing(BigNumber.from(listingId));
    const offers = await this.contractWrapper.readContract.winningBid(
      listingId,
    );
    if (offers.offeror === AddressZero) {
      return undefined;
    }
    return await this.mapOffer(BigNumber.from(listingId), offers);
  }

  public async getBidBufferBps(): Promise<BigNumber> {
    return this.contractWrapper.readContract.bidBufferBps();
  }

  public async getTimeBufferInSeconds(): Promise<BigNumber> {
    return this.contractWrapper.readContract.timeBuffer();
  }

  /**
   * Get Auction Winner
   *
   * @remarks Get the winner of the auction after an auction ends.
   *
   * @example
   * ```javascript
   * // The listing ID of the auction that closed
   * const listingId = 0;
   *
   * contract
   *   .getAuctionWinner(listingId)
   *   .then((auctionWinner) => console.log(auctionWinner))
   *   .catch((err) => console.error(err));
   * ```
   */
  public async getAuctionWinner(listingId: BigNumberish): Promise<string> {
    // TODO this should be via indexer or direct contract call
    const closedAuctions = await this.contractWrapper.readContract.queryFilter(
      this.contractWrapper.readContract.filters.AuctionClosed(),
    );

    const auction = closedAuctions.find((a) =>
      a.args.listingId.eq(BigNumber.from(listingId)),
    );

    if (!auction) {
      throw new Error(
        `Could not find auction with listingId ${listingId} in closed auctions`,
      );
    }

    return auction.args.winningBidder;
  }

  /**
   * Convenience function to get either a direct or auction listing
   *
   * @param listingId the listing id
   * @returns either a direct or auction listing
   */
  public async getListing(
    listingId: BigNumberish,
  ): Promise<AuctionListing | DirectListing> {
    const listing = await this.contractWrapper.readContract.listings(listingId);
    if (listing.assetContract === AddressZero) {
      throw new ListingNotFoundError(this.getAddress(), listingId.toString());
    }
    switch (listing.listingType) {
      case ListingType.Auction: {
        return await this.mapAuctionListing(listing);
      }
      case ListingType.Direct: {
        return await this.mapDirectListing(listing);
      }
      default: {
        throw new Error(`Unknown listing type: ${listing.listingType}`);
      }
    }
  }

  /**
   * Get all the listings
   *
   * @remarks Fetch all the active listings from this marketplace contract.
   *
   * ```javascript
   * const listings = await contract.getAllListings();
   * const priceOfFirstListing = listings[0].price;
   * ```
   *
   * @param filter - optional filters
   */
  public async getAllListings(
    filter?: MarketplaceFilter,
  ): Promise<(AuctionListing | DirectListing)[]> {
    let rawListings = await this.getAllListingsNoFilter();

    if (filter) {
      if (filter.seller) {
        rawListings = rawListings.filter(
          (seller) =>
            seller.sellerAddress.toString().toLowerCase() ===
            filter?.seller?.toString().toLowerCase(),
        );
      }
      if (filter.tokenContract) {
        if (!filter.tokenId) {
          rawListings = rawListings.filter(
            (tokenContract) =>
              tokenContract.assetContractAddress.toString().toLowerCase() ===
              filter?.tokenContract?.toString().toLowerCase(),
          );
        } else {
          rawListings = rawListings.filter(
            (tokenContract) =>
              tokenContract.assetContractAddress.toString().toLowerCase() ===
                filter?.tokenContract?.toString().toLowerCase() &&
              tokenContract.tokenId.toString() === filter?.tokenId?.toString(),
          );
        }
      }
      if (filter.start !== undefined) {
        const start = filter.start;
        rawListings = rawListings.filter((_, index) => index >= start);
        if (filter.count !== undefined && rawListings.length > filter.count) {
          rawListings = rawListings.slice(0, filter.count);
        }
      }
    }
    return rawListings.filter((l) => l !== undefined) as (
      | AuctionListing
      | DirectListing
    )[];
  }

  /**
   * Get whether listing is restricted only to addresses with the Lister role
   */
  public async isRestrictedToListerRoleOnly(): Promise<boolean> {
    const anyoneCanList = await this.contractWrapper.readContract.hasRole(
      getRoleHash("lister"),
      AddressZero,
    );
    return !anyoneCanList;
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Create Direct Listing
   *
   * @remarks Create a new listing on the marketplace where people can buy an asset directly.
   *
   * @example
   * ```javascript
   * // Data of the listing you want to create
   * const listing = {
   *   // address of the contract the asset you want to list is on
   *   assetContractAddress: "0x...",
   *   // token ID of the asset you want to list
   *   tokenId: "0",
   *   // in how many seconds with the listing open up
   *   startTimeInSeconds: 0,
   *   // how long the listing will be open for
   *   listingDurationInSeconds: 86400,
   *   // how many of the asset you want to list
   *   quantity: 1,
   *   // address of the currency contract that will be used to pay for the listing
   *   currencyContractAddress: "0x0000000000000000000000000000000000000000",
   *   // how much the asset will be sold for
   *   buyoutPricePerToken: "1.5",
   * }
   *
   * const tx = await contract.createDirectListing(listing);
   * const receipt = tx.receipt; // the transaction receipt
   * const id = tx.id; // the id of the newly created listing
   * ```
   */
  public async createDirectListing(
    listing: NewDirectListing,
  ): Promise<TransactionResultWithId> {
    this.validateNewListingParam(listing);

    await this.handleTokenApproval(
      listing.assetContractAddress,
      listing.tokenId,
      await this.contractWrapper.getSignerAddress(),
    );

    const normalizedPricePerToken = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      listing.buyoutPricePerToken,
      listing.currencyContractAddress,
    );

    const receipt = await this.contractWrapper.sendTransaction(
      "createListing",
      [
        {
          assetContract: listing.assetContractAddress,
          tokenId: listing.tokenId,
          buyoutPricePerToken: normalizedPricePerToken,
          currencyToAccept: listing.currencyContractAddress,
          listingType: ListingType.Direct,
          quantityToList: listing.quantity,
          reservePricePerToken: listing.buyoutPricePerToken,
          secondsUntilEndTime: listing.listingDurationInSeconds,
          startTime: listing.startTimeInSeconds,
        } as ListingParametersStruct,
      ],
    );

    const event = this.contractWrapper.parseEventLogs(
      "NewListing",
      receipt?.logs,
    );
    return {
      id: event.listingId,
      receipt,
    };
  }

  /**
   * Create Auction
   *
   * @remarks Create a new auction where people can bid on an asset.
   *
   * @example
   * ```javascript
   * // Data of the auction you want to create
   * const auction = {
   *   // address of the contract the asset you want to list is on
   *   assetContractAddress: "0x...",
   *   // token ID of the asset you want to list
   *   tokenId: "0",
   *   // in how many seconds with the listing open up
   *   startTimeInSeconds: 0,
   *   // how long the listing will be open for
   *   listingDurationInSeconds: 86400,
   *   // how many of the asset you want to list
   *   quantity: 1,
   *   // address of the currency contract that will be used to pay for the listing
   *   currencyContractAddress: "0x0000000000000000000000000000000000000000",
   *   // how much people would have to bid to instantly buy the asset
   *   buyoutPricePerToken: "10",
   *   // the minimum bid that will be accepted for the token
   *   reservePricePerToken: "1.5",
   * }
   *
   * const tx = await contract.createAuctionListing(auction);
   * const receipt = tx.receipt; // the transaction receipt
   * const id = tx.id; // the id of the newly created listing
   * ```
   */
  public async createAuctionListing(
    listing: NewAuctionListing,
  ): Promise<TransactionResultWithId> {
    this.validateNewListingParam(listing);

    await this.handleTokenApproval(
      listing.assetContractAddress,
      listing.tokenId,
      await this.contractWrapper.getSignerAddress(),
    );

    const normalizedPricePerToken = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      listing.buyoutPricePerToken,
      listing.currencyContractAddress,
    );

    const normalizedReservePrice = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      listing.reservePricePerToken,
      listing.currencyContractAddress,
    );

    const receipt = await this.contractWrapper.sendTransaction(
      "createListing",
      [
        {
          assetContract: listing.assetContractAddress,
          tokenId: listing.tokenId,
          buyoutPricePerToken: normalizedPricePerToken,
          currencyToAccept: listing.currencyContractAddress,
          listingType: ListingType.Auction,
          quantityToList: listing.quantity,
          reservePricePerToken: normalizedReservePrice,
          secondsUntilEndTime: listing.listingDurationInSeconds,
          startTime: listing.startTimeInSeconds,
        } as ListingParametersStruct,
      ],
    );

    const event = this.contractWrapper.parseEventLogs(
      "NewListing",
      receipt?.logs,
    );
    return {
      id: event.listingId,
      receipt,
    };
  }

  /**
   * Make an offer for a Direct Listing
   *
   */
  public async makeDirectListingOffer(
    listingId: BigNumberish,
    quantityDesired: BigNumberish,
    currencyContractAddress: string,
    pricePerToken: Price,
  ): Promise<TransactionResult> {
    if (isNativeToken(currencyContractAddress)) {
      throw new Error(
        "You must use the wrapped native token address when making an offer with a native token",
      );
    }

    const normalizedPrice = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      pricePerToken,
      currencyContractAddress,
    );

    try {
      await this.getDirectListing(listingId);
    } catch (err) {
      console.error("Failed to get listing, err =", err);
      throw new Error(`Error getting the listing with id ${listingId}`);
    }

    const quantity = BigNumber.from(quantityDesired);
    const value = BigNumber.from(normalizedPrice).mul(quantity);
    const overrides = (await this.contractWrapper.getCallOverrides()) || {};
    await setErc20Allowance(
      this.contractWrapper,
      value,
      currencyContractAddress,
      overrides,
    );

    return {
      receipt: await this.contractWrapper.sendTransaction(
        "offer",
        [listingId, quantityDesired, currencyContractAddress, normalizedPrice],
        overrides,
      ),
    };
  }

  public async acceptDirectListingOffer(
    listingId: BigNumberish,
    addressOfOfferor: string,
  ): Promise<TransactionResult> {
    /**
     * TODO:
     * - Provide better error handling if offer is too lower.
     */
    await this.validateDirectListing(BigNumber.from(listingId));
    return {
      receipt: await this.contractWrapper.sendTransaction("acceptOffer", [
        listingId,
        addressOfOfferor,
      ]),
    };
  }

  /**
   * Buy Listing
   *
   * @remarks Buy a specific direct listing from the marketplace.
   *
   * @example
   * ```javascript
   * // The listing ID of the asset you want to buy
   * const listingId = 0;
   * // Quantity of the asset you want to buy
   * const quantityDesired = 1;
   *
   * await contract.buyoutDirectListing(listingId, quantityDesired);
   * ```
   */
  public async buyoutDirectListing(
    listingId: BigNumberish,
    quantityDesired: BigNumberish,
  ): Promise<TransactionResult> {
    const listing = await this.validateDirectListing(BigNumber.from(listingId));
    const valid = await this.isStillValidDirectListing(
      listing,
      quantityDesired,
    );
    if (!valid) {
      throw new Error(
        "The asset on this listing has been moved from the lister's wallet, this listing is now invalid",
      );
    }
    const quantity = BigNumber.from(quantityDesired);
    const value = BigNumber.from(listing.buyoutPrice).mul(quantity);
    const overrides = (await this.contractWrapper.getCallOverrides()) || {};
    await setErc20Allowance(
      this.contractWrapper,
      value,
      listing.currencyContractAddress,
      overrides,
    );
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "buy",
        [listingId, quantity, listing.currencyContractAddress, value],
        overrides,
      ),
    };
  }

  /**
   * Buyout Auction
   *
   * @remarks Buy a specific direct listing from the marketplace.
   *
   * @example
   * ```javascript
   * // The listing ID of the asset you want to buy
   * const listingId = 0;
   *
   * await contract.buyoutAuctionListing(listingId);
   * ```
   */
  public async buyoutAuctionListing(
    listingId: BigNumberish,
  ): Promise<TransactionResult> {
    const listing = await this.validateAuctionListing(
      BigNumber.from(listingId),
    );

    const currencyMetadata = await fetchCurrencyMetadata(
      this.contractWrapper.getProvider(),
      listing.currencyContractAddress,
    );

    return this.makeAuctionListingBid(
      listingId,
      ethers.utils.formatUnits(listing.buyoutPrice, currencyMetadata.decimals),
    );
  }

  /**
   * Convenience function to buy a Direct or Auction listing.
   * @param listingId - the listing ID of the listing you want to buy
   * @param quantityDesired - the quantity that you want to buy (for ERC1155 tokens)
   */
  public async buyoutListing(
    listingId: BigNumberish,
    quantityDesired?: BigNumberish,
  ): Promise<TransactionResult> {
    const listing = await this.contractWrapper.readContract.listings(listingId);
    if (listing.listingId.toString() !== listingId.toString()) {
      throw new ListingNotFoundError(this.getAddress(), listingId.toString());
    }
    switch (listing.listingType) {
      case ListingType.Direct: {
        invariant(
          quantityDesired !== undefined,
          "quantityDesired is required when buying out a direct listing",
        );
        return await this.buyoutDirectListing(listingId, quantityDesired);
      }
      case ListingType.Auction: {
        return await this.buyoutAuctionListing(listingId);
      }
      default:
        throw Error(`Unknown listing type: ${listing.listingType}`);
    }
  }

  /**
   * Bid On Auction
   *
   * @remarks Make a bid on an auction listings
   *
   * @example
   * ```javascript
   * // The listing ID of the asset you want to bid on
   * const listingId = 0;
   * // The price you are willing to bid for a single token of the listing
   * const pricePerToken = 1;
   *
   * await contract.makeAuctionListingBid(listingId, pricePerToken);
   * ```
   */
  public async makeAuctionListingBid(
    listingId: BigNumberish,
    pricePerToken: Price,
  ): Promise<TransactionResult> {
    const listing = await this.validateAuctionListing(
      BigNumber.from(listingId),
    );

    const normalizedPrice = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      pricePerToken,
      listing.currencyContractAddress,
    );

    const bidBuffer = await this.getBidBufferBps();
    const winningBid = await this.getWinningBid(listingId);
    if (winningBid) {
      const isWinningBid = await this.isWinningBid(
        winningBid.pricePerToken,
        normalizedPrice,
        bidBuffer,
      );

      invariant(
        isWinningBid,
        "Bid price is too low based on the current winning bid and the bid buffer",
      );
    } else {
      const tokenPrice = normalizedPrice;
      const reservePrice = BigNumber.from(listing.reservePrice);
      invariant(
        tokenPrice.gte(reservePrice),
        "Bid price is too low based on reserve price",
      );
    }

    const quantity = BigNumber.from(listing.quantity);
    const value = normalizedPrice.mul(quantity);

    const overrides = (await this.contractWrapper.getCallOverrides()) || {};
    await setErc20Allowance(
      this.contractWrapper,
      value,
      listing.currencyContractAddress,
      overrides,
    );

    return {
      receipt: await this.contractWrapper.sendTransaction(
        "offer",
        [
          listingId,
          listing.quantity,
          listing.currencyContractAddress,
          normalizedPrice,
        ],
        overrides,
      ),
    };
  }

  /**
   * Update a Direct listing with new metadata.
   *
   * Note: cannot update a listing with a new quantity of 0. Use `cancelDirectListing` to remove a listing instead.
   *
   * @param listing - the new listing information
   */
  public async updateDirectListing(
    listing: DirectListing,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("updateListing", [
        listing.id,
        listing.quantity,
        listing.buyoutPrice, // reserve price, doesn't matter for direct listing
        listing.buyoutPrice,
        listing.currencyContractAddress,
        listing.startTimeInSeconds,
        listing.secondsUntilEnd,
      ]),
    };
  }

  /**
   * Update an Auction listing with new metadata
   * @param listing
   */
  public async updateAuctionListing(
    listing: AuctionListing,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("updateListing", [
        listing.id,
        listing.quantity,
        listing.reservePrice,
        listing.buyoutPrice,
        listing.currencyContractAddress,
        listing.startTimeInEpochSeconds,
        listing.endTimeInEpochSeconds,
      ]),
    };
  }

  /**
   * Cancel Direct Listing
   *
   * @remarks Cancel a direct listing on the marketplace
   *
   * @example
   * ```javascript
   * // The listing ID of the direct listing you want to cancel
   * const listingId = "0";
   *
   * await contract.cancelDirectListing(listingId);
   * ```
   */
  public async cancelDirectListing(
    listingId: BigNumberish,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "cancelDirectListing",
        [listingId],
      ),
    };
  }

  /**
   * Cancel Auction Listing
   *
   * @remarks Cancel an auction listing on the marketplace
   *
   * @example
   * ```javascript
   * // The listing ID of the auction listing you want to cancel
   * const listingId = "0";
   *
   * await contract.cancelAuctionListing(listingId);
   * ```
   */
  public async cancelAuctionListing(
    listingId: BigNumberish,
  ): Promise<TransactionResult> {
    const listing = await this.validateAuctionListing(
      BigNumber.from(listingId),
    );

    const now = BigNumber.from(Math.floor(Date.now() / 1000));
    const startTime = BigNumber.from(listing.startTimeInEpochSeconds);

    const offers = await this.contractWrapper.readContract.winningBid(
      listingId,
    );
    if (now.gt(startTime) && offers.offeror !== AddressZero) {
      throw new AuctionAlreadyStartedError(listingId.toString());
    }

    return {
      receipt: await this.contractWrapper.sendTransaction("closeAuction", [
        BigNumber.from(listingId),
        await this.contractWrapper.getSignerAddress(),
      ]),
    };
  }

  /**
   * Close the Auction
   *
   * @remarks Closes the Auction and executes the sale.
   *
   * @example
   * ```javascript
   * // The listing ID of the auction listing you want to close
   * const listingId = "0";
   * await closeAuctionListing(listindId);
   * ```
   *
   * @param listingId - the auction  listing ud to close
   * @param closeFor - optionally pass the address the auction creator address or winning bid offeror address to close the auction on their behalf
   */
  public async closeAuctionListing(
    listingId: BigNumberish,
    closeFor?: string,
  ): Promise<TransactionResult> {
    if (!closeFor) {
      closeFor = await this.contractWrapper.getSignerAddress();
    }
    const listing = await this.validateAuctionListing(
      BigNumber.from(listingId),
    );
    try {
      return {
        receipt: await this.contractWrapper.sendTransaction("closeAuction", [
          BigNumber.from(listingId),
          closeFor,
        ]),
      };
    } catch (err: any) {
      if (err.message.includes("cannot close auction before it has ended")) {
        throw new AuctionHasNotEndedError(
          listingId.toString(),
          listing.endTimeInEpochSeconds.toString(),
        );
      } else {
        throw err;
      }
    }
  }

  /**
   * Set the Bid buffer: this is a percentage (e.g. 5%) in basis points (5% = 500, 100% = 10000). A new bid is considered to be a winning bid only if its bid amount is at least the bid buffer (e.g. 5%) greater than the previous winning bid. This prevents buyers from making very slightly higher bids to win the auctioned items.
   * @param bufferBps
   */
  public async setBidBufferBps(bufferBps: BigNumberish): Promise<void> {
    await this.roles.verify(
      ["admin"],
      await this.contractWrapper.getSignerAddress(),
    );

    const timeBuffer = await this.getTimeBufferInSeconds();
    await this.contractWrapper.sendTransaction("setAuctionBuffers", [
      timeBuffer,
      BigNumber.from(bufferBps),
    ]);
  }

  /**
   * Set the Time buffer: this is measured in seconds (e.g. 15 minutes or 900 seconds). If a winning bid is made within the buffer of the auction closing (e.g. 15 minutes within the auction closing), the auction's closing time is increased by the buffer to prevent buyers from making last minute winning bids, and to give time to other buyers to make a higher bid if they wish to.
   * @param bufferInSeconds
   */
  public async setTimeBufferInSeconds(
    bufferInSeconds: BigNumberish,
  ): Promise<void> {
    await this.roles.verify(
      ["admin"],
      await this.contractWrapper.getSignerAddress(),
    );

    const bidBuffer = await this.getBidBufferBps();
    await this.contractWrapper.sendTransaction("setAuctionBuffers", [
      BigNumber.from(bufferInSeconds),
      bidBuffer,
    ]);
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  private async isWinningBid(
    winningPrice: BigNumberish,
    newBidPrice: BigNumberish,
    bidBuffer: BigNumberish,
  ): Promise<boolean> {
    bidBuffer = BigNumber.from(bidBuffer);
    winningPrice = BigNumber.from(winningPrice);
    newBidPrice = BigNumber.from(newBidPrice);
    const buffer = newBidPrice.sub(winningPrice).mul(MAX_BPS).div(winningPrice);
    return buffer.gte(bidBuffer);
  }

  /**
   * Helper method maps the auction listing to the direct listing interface.
   *
   * @internal
   * @param listing - The listing to map, as returned from the contract.
   * @returns - The mapped interface.
   */
  private async mapDirectListing(
    listing: ListingStruct,
  ): Promise<DirectListing> {
    return {
      assetContractAddress: listing.assetContract,
      buyoutPrice: BigNumber.from(listing.buyoutPricePerToken),
      currencyContractAddress: listing.currency,
      buyoutCurrencyValuePerToken: await fetchCurrencyValue(
        this.contractWrapper.getProvider(),
        listing.currency,
        listing.buyoutPricePerToken,
      ),
      id: listing.listingId.toString(),
      tokenId: listing.tokenId,
      quantity: listing.quantity,
      startTimeInSeconds: listing.startTime,
      asset: await fetchTokenMetadataForContract(
        listing.assetContract,
        this.contractWrapper.getProvider(),
        listing.tokenId,
        this.storage,
      ),
      secondsUntilEnd: listing.endTime,
      sellerAddress: listing.tokenOwner,
      type: ListingType.Direct,
    };
  }

  /**
   * Helper method maps the auction listing to the auction listing interface.
   *
   * @internal
   * @param listing - The listing to map, as returned from the contract.
   * @returns - The mapped interface.
   */
  private async mapAuctionListing(
    listing: ListingStruct,
  ): Promise<AuctionListing> {
    return {
      assetContractAddress: listing.assetContract,
      buyoutPrice: BigNumber.from(listing.buyoutPricePerToken),
      currencyContractAddress: listing.currency,
      buyoutCurrencyValuePerToken: await fetchCurrencyValue(
        this.contractWrapper.getProvider(),
        listing.currency,
        listing.buyoutPricePerToken,
      ),
      id: listing.listingId.toString(),
      tokenId: listing.tokenId,
      quantity: listing.quantity,
      startTimeInEpochSeconds: listing.startTime,
      asset: await fetchTokenMetadataForContract(
        listing.assetContract,
        this.contractWrapper.getProvider(),
        listing.tokenId,
        this.storage,
      ),
      reservePriceCurrencyValuePerToken: await fetchCurrencyValue(
        this.contractWrapper.getProvider(),
        listing.currency,
        listing.reservePricePerToken,
      ),
      reservePrice: BigNumber.from(listing.reservePricePerToken),
      endTimeInEpochSeconds: listing.endTime,
      sellerAddress: listing.tokenOwner,
      type: ListingType.Auction,
    };
  }

  private async handleTokenApproval(
    assetContract: string,
    tokenId: BigNumberish,
    from: string,
  ): Promise<void> {
    const signer = this.contractWrapper.getSigner();
    const provider = this.contractWrapper.getProvider();
    const erc165 = ERC165__factory.connect(assetContract, signer || provider);
    const isERC721 = await erc165.supportsInterface(InterfaceId_IERC721);
    const isERC1155 = await erc165.supportsInterface(InterfaceId_IERC1155);
    // check for token approval
    if (isERC721) {
      const asset = new ContractWrapper<IERC721>(
        signer || provider,
        assetContract,
        IERC721__factory.abi,
        {},
      );
      const approved = await asset.readContract.isApprovedForAll(
        from,
        this.getAddress(),
      );
      if (!approved) {
        const isTokenApproved =
          (await asset.readContract.getApproved(tokenId)).toLowerCase() ===
          this.getAddress().toLowerCase();

        if (!isTokenApproved) {
          await asset.sendTransaction("setApprovalForAll", [
            this.getAddress(),
            true,
          ]);
        }
      }
    } else if (isERC1155) {
      const asset = new ContractWrapper<IERC1155>(
        signer || provider,
        assetContract,
        IERC1155__factory.abi,
        {},
      );

      const approved = await asset.readContract.isApprovedForAll(
        from,
        this.getAddress(),
      );
      if (!approved) {
        await asset.sendTransaction("setApprovalForAll", [
          this.getAddress(),
          true,
        ]);
      }
    } else {
      throw Error("Contract must implement ERC 1155 or ERC 721.");
    }
  }

  /**
   * This method checks if the given token is approved for the marketplace contract.
   * This is particularly useful for direct listings where the token
   * being listed may be moved before the listing is actually closed.
   *
   * TODO: Ask Jake/Krishang: do we need to also check the owners balance of the token,
   * based on the listing quantity? I.e. query the balance of the tokenId, and check if
   * the seller holds enough of the token
   *
   * @internal
   * @param assetContract - The address of the asset contract.
   * @param tokenId - The token id of the token.
   * @param from - The address of the account that owns the token.
   * @returns - True if the marketplace is approved on the token, false otherwise.
   */
  private async isTokenApprovedForMarketplace(
    assetContract: string,
    tokenId: BigNumberish,
    from: string,
  ): Promise<boolean> {
    try {
      const provider = this.contractWrapper.getProvider();
      const erc165 = ERC165__factory.connect(assetContract, provider);
      const isERC721 = await erc165.supportsInterface(InterfaceId_IERC721);
      const isERC1155 = await erc165.supportsInterface(InterfaceId_IERC1155);
      if (isERC721) {
        const asset = IERC721__factory.connect(assetContract, provider);

        const approved = await asset.isApprovedForAll(from, this.getAddress());
        if (approved) {
          return true;
        }
        return (
          (await asset.getApproved(tokenId)).toLowerCase() ===
          this.getAddress().toLowerCase()
        );
      } else if (isERC1155) {
        const asset = IERC1155__factory.connect(assetContract, provider);
        return await asset.isApprovedForAll(from, this.getAddress());
      } else {
        console.error("Contract does not implement ERC 1155 or ERC 721.");
        return false;
      }
    } catch (err: any) {
      console.error("Failed to check if token is approved", err);
      return false;
    }
  }

  /**
   * Use this method to check if a direct listing is still valid.
   *
   * Ways a direct listing can become invalid:
   * 1. The asset holder transferred the asset to another wallet
   * 2. The asset holder burned the asset
   * 3. The asset holder removed the approval on the marketplace
   *
   * @internal
   * @param listing - The listing to check.
   * @returns - True if the listing is valid, false otherwise.
   */
  private async isStillValidDirectListing(
    listing: DirectListing,
    quantity?: BigNumberish,
  ): Promise<boolean> {
    const approved = await this.isTokenApprovedForMarketplace(
      listing.assetContractAddress,
      listing.tokenId,
      listing.sellerAddress,
    );

    if (!approved) {
      return false;
    }

    const provider = this.contractWrapper.getProvider();
    const erc165 = ERC165__factory.connect(
      listing.assetContractAddress,
      provider,
    );
    const isERC721 = await erc165.supportsInterface(InterfaceId_IERC721);
    const isERC1155 = await erc165.supportsInterface(InterfaceId_IERC1155);
    if (isERC721) {
      const asset = IERC721__factory.connect(
        listing.assetContractAddress,
        provider,
      );
      return (
        (await asset.ownerOf(listing.tokenId)).toLowerCase() ===
        listing.sellerAddress.toLowerCase()
      );
    } else if (isERC1155) {
      const asset = IERC1155__factory.connect(
        listing.assetContractAddress,
        provider,
      );
      const balance = await asset.balanceOf(
        listing.sellerAddress,
        listing.tokenId,
      );
      return balance.gte(quantity || listing.quantity);
    } else {
      console.error("Contract does not implement ERC 1155 or ERC 721.");
      return false;
    }
  }

  /**
   * Throws error if listing could not be found
   *
   * @param listingId - Listing to check for
   */
  private async validateDirectListing(
    listingId: BigNumber,
  ): Promise<DirectListing> {
    try {
      return await this.getDirectListing(listingId);
    } catch (err) {
      console.error(`Error getting the listing with id ${listingId}`);
      throw err;
    }
  }

  /**
   * Throws error if listing could not be found
   *
   * @param listingId - Listing to check for
   */
  private async validateAuctionListing(
    listingId: BigNumber,
  ): Promise<AuctionListing> {
    try {
      return await this.getAuctionListing(listingId);
    } catch (err) {
      console.error(`Error getting the listing with id ${listingId}`);
      throw err;
    }
  }

  /**
   * Maps a contract offer to the strict interface
   *
   * @internal
   * @param offer
   * @returns - An `Offer` object
   */
  private async mapOffer(listingId: BigNumber, offer: any): Promise<Offer> {
    return {
      quantity: offer.quantityDesired,
      pricePerToken: offer.pricePerToken,
      currencyContractAddress: offer.currency,
      buyerAddress: offer.offeror,
      quantityDesired: offer.quantityWanted,
      currencyValue: await fetchCurrencyValue(
        this.contractWrapper.getProvider(),
        offer.currency,
        (offer.quantityWanted as BigNumber).mul(
          offer.pricePerToken as BigNumber,
        ),
      ),
      listingId,
    } as Offer;
  }

  private async getAllListingsNoFilter(): Promise<
    (AuctionListing | DirectListing)[]
  > {
    const listings = await Promise.all(
      Array.from(
        Array(
          (await this.contractWrapper.readContract.totalListings()).toNumber(),
        ).keys(),
      ).map(async (i) => {
        let listing;

        try {
          listing = await this.getListing(i);
        } catch (err) {
          return undefined;
        }

        if (listing.type === ListingType.Auction) {
          return listing;
        }

        const valid = await this.isStillValidDirectListing(listing);
        if (!valid) {
          return undefined;
        }

        return listing;
      }),
    );
    return listings.filter((l) => l !== undefined) as (
      | AuctionListing
      | DirectListing
    )[];
  }

  // TODO: Complete method implementation with subgraph
  // /**
  //  * @beta - This method is not yet complete.
  //  *
  //  * @param listingId
  //  * @returns
  //  */
  // public async getActiveOffers(listingId: BigNumberish): Promise<Offer[]> {
  //   const listing = await this.validateDirectListing(BigNumber.from(listingId));

  //   const offers = await this.readOnlyContract.offers(listing.id, "");

  //   return await Promise.all(
  //     offers.map(async (offer: any) => {
  //       return await this.mapOffer(BigNumber.from(listingId), offer);
  //     }),
  //   );
  // }
  /**
   * Used to verify fields in new listing.
   * @internal
   */
  // TODO this should be done in zod?
  private validateNewListingParam(param: NewDirectListing | NewAuctionListing) {
    invariant(
      param.assetContractAddress !== undefined &&
        param.assetContractAddress !== null,
      "Asset contract address is required",
    );
    invariant(
      param.buyoutPricePerToken !== undefined &&
        param.buyoutPricePerToken !== null,
      "Buyout price is required",
    );
    invariant(
      param.listingDurationInSeconds !== undefined &&
        param.listingDurationInSeconds !== null,
      "Listing duration is required",
    );
    invariant(
      param.startTimeInSeconds !== undefined &&
        param.startTimeInSeconds !== null,
      "Start time is required",
    );
    invariant(
      param.tokenId !== undefined && param.tokenId !== null,
      "Token ID is required",
    );
    invariant(
      param.quantity !== undefined && param.quantity !== null,
      "Quantity is required",
    );

    switch (param.type) {
      case "NewAuctionListing": {
        invariant(
          param.reservePricePerToken !== undefined &&
            param.reservePricePerToken !== null,
          "Reserve price is required",
        );
      }
    }
  }
}
