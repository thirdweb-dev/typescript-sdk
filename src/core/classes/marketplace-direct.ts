import { ContractWrapper } from "./contract-wrapper";
import {
  ERC165__factory,
  IERC1155__factory,
  IERC721__factory,
  IMarketplace,
  Marketplace,
} from "@thirdweb-dev/contracts";
import { BigNumber, BigNumberish } from "ethers";
import {
  DirectListing,
  NewDirectListing,
  Offer,
} from "../../types/marketplace";
import { AddressZero } from "@ethersproject/constants";
import { ListingNotFoundError, WrongListingTypeError } from "../../common";
import { ListingType } from "../../enums";
import { TransactionResult, TransactionResultWithId } from "../types";
import {
  fetchCurrencyValue,
  isNativeToken,
  normalizePriceValue,
  setErc20Allowance,
} from "../../common/currency";
import { Price } from "../../types/currency";
import { fetchTokenMetadataForContract } from "../../common/nft";
import {
  InterfaceId_IERC1155,
  InterfaceId_IERC721,
} from "../../constants/contract";
import {
  handleTokenApproval,
  isTokenApprovedForMarketplace,
  mapOffer,
  validateNewListingParam,
} from "../../common/marketplace";
import { IStorage } from "../interfaces";
import invariant from "tiny-invariant";
import { isAddress } from "ethers/lib/utils";
import { ListingAddedEvent } from "@thirdweb-dev/contracts/dist/Marketplace";

/**
 * Handles direct listings
 * @public
 */
export class MarketplaceDirect {
  private contractWrapper: ContractWrapper<Marketplace>;
  private storage: IStorage;

  constructor(
    contractWrapper: ContractWrapper<Marketplace>,
    storage: IStorage,
  ) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
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
   * @param listingId - the listing id
   * @returns the Direct listing object
   */
  public async getListing(listingId: BigNumberish): Promise<DirectListing> {
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

    return await this.mapListing(listing);
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
    await this.validateListing(BigNumber.from(listingId));
    invariant(isAddress(address), "Address must be a valid address");
    const offers = await this.contractWrapper.readContract.offers(
      listingId,
      address,
    );
    if (offers.offeror === AddressZero) {
      return undefined;
    }
    return await mapOffer(
      this.contractWrapper.getProvider(),
      BigNumber.from(listingId),
      offers,
    );
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
   *   // in how many seconds will the listing open up
   *   startTimeInSeconds: 0,
   *   // how long the listing will be open for
   *   listingDurationInSeconds: 86400,
   *   // how many of the asset you want to list
   *   quantity: 1,
   *   // address of the currency contract that will be used to pay for the listing
   *   currencyContractAddress: NATIVE_TOKEN_ADDRESS,
   *   // how much the asset will be sold for
   *   buyoutPricePerToken: "1.5",
   * }
   *
   * const tx = await contract.direct.createListing(listing);
   * const receipt = tx.receipt; // the transaction receipt
   * const id = tx.id; // the id of the newly created listing
   * ```
   */
  public async createListing(
    listing: NewDirectListing,
  ): Promise<TransactionResultWithId> {
    validateNewListingParam(listing);

    await handleTokenApproval(
      this.contractWrapper.getSignerOrProvider(),
      this.getAddress(),
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
          reservePricePerToken: normalizedPricePerToken,
          secondsUntilEndTime: listing.listingDurationInSeconds,
          startTime: listing.startTimeInSeconds,
        } as IMarketplace.ListingParametersStruct,
      ],
    );

    const event = this.contractWrapper.parseLogs<ListingAddedEvent>(
      "ListingAdded",
      receipt?.logs,
    );
    return {
      id: event[0].args.listingId,
      receipt,
    };
  }

  /**
   * Make an offer for a Direct Listing
   *
   */
  public async makeOffer(
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
      await this.getListing(listingId);
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

  public async acceptOffer(
    listingId: BigNumberish,
    addressOfOfferor: string,
  ): Promise<TransactionResult> {
    /**
     * TODO:
     * - Provide better error handling if offer is too low.
     */
    await this.validateListing(BigNumber.from(listingId));
    const offer = await this.contractWrapper.readContract.offers(
      listingId,
      addressOfOfferor,
    );
    return {
      receipt: await this.contractWrapper.sendTransaction("acceptOffer", [
        listingId,
        addressOfOfferor,
        offer.currency,
        offer.pricePerToken,
      ]),
    };
  }

  /**
   * Buy a Listing
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
   * await contract.direct.buyoutListing(listingId, quantityDesired);
   * ```
   *
   * @param listingId - The listing id to buy
   * @param quantityDesired - the quantity to buy
   * @param receiver - optional receiver of the bought listing if different from the connected wallet
   */
  public async buyoutListing(
    listingId: BigNumberish,
    quantityDesired: BigNumberish,
    receiver?: string,
  ): Promise<TransactionResult> {
    const listing = await this.validateListing(BigNumber.from(listingId));
    const valid = await this.isStillValidListing(listing, quantityDesired);
    if (!valid) {
      throw new Error(
        "The asset on this listing has been moved from the lister's wallet, this listing is now invalid",
      );
    }
    const buyFor = receiver
      ? receiver
      : await this.contractWrapper.getSignerAddress();
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
        [listingId, buyFor, quantity, listing.currencyContractAddress, value],
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
  public async updateListing(
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
   * Cancel Direct Listing
   *
   * @remarks Cancel a direct listing on the marketplace
   *
   * @example
   * ```javascript
   * // The listing ID of the direct listing you want to cancel
   * const listingId = "0";
   *
   * await contract.direct.cancelListing(listingId);
   * ```
   */
  public async cancelListing(
    listingId: BigNumberish,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "cancelDirectListing",
        [listingId],
      ),
    };
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * Throws error if listing could not be found
   *
   * @param listingId - Listing to check for
   */
  private async validateListing(listingId: BigNumber): Promise<DirectListing> {
    try {
      return await this.getListing(listingId);
    } catch (err) {
      console.error(`Error getting the listing with id ${listingId}`);
      throw err;
    }
  }

  /**
   * Helper method maps the auction listing to the direct listing interface.
   *
   * @internal
   * @param listing - The listing to map, as returned from the contract.
   * @returns - The mapped interface.
   */
  public async mapListing(
    listing: IMarketplace.ListingStruct,
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
  public async isStillValidListing(
    listing: DirectListing,
    quantity?: BigNumberish,
  ): Promise<boolean> {
    const approved = await isTokenApprovedForMarketplace(
      this.contractWrapper.getProvider(),
      this.getAddress(),
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
}
