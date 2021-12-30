import {
  ERC1155__factory,
  ERC165__factory,
  ERC20__factory,
  ERC721__factory,
  Marketplace,
  Marketplace__factory,
} from "@3rdweb/contracts";
import { ListingParametersStruct } from "@3rdweb/contracts/dist/IMarketplace";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish } from "ethers";
import { isAddress } from "ethers/lib/utils";
import {
  getCurrencyValue,
  InterfaceId_IERC721,
  ModuleType,
  Role,
  RolesMap,
} from "../common";
import { NATIVE_TOKEN_ADDRESS } from "../common/currency";
import {
  AuctionAlreadyStartedError,
  ListingNotFoundError,
  WrongListingTypeError,
} from "../common/error";
import { invariant } from "../common/invariant";
import { ModuleWithRoles } from "../core/module";
import { ListingType } from "../enums/marketplace/ListingType";
import { IMarketplace } from "../interfaces/modules";
import {
  AuctionListing,
  NewAuctionListing,
  NewDirectListing,
  Offer,
} from "../types";
import { DirectListing } from "../types/marketplace/DirectListing";

const MAX_BPS = 10000;

/**
 * Access this module by calling {@link ThirdwebSDK.getMarketplaceModule}
 * @public
 */
export class MarketplaceModule
  extends ModuleWithRoles<Marketplace>
  implements IMarketplace
{
  public static moduleType: ModuleType = ModuleType.MARKETPLACE;

  public static roles = [
    RolesMap.admin,
    RolesMap.lister,
    RolesMap.pauser,
  ] as const;

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return MarketplaceModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): Marketplace {
    return Marketplace__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return MarketplaceModule.moduleType;
  }

  public async createDirectListing(
    listing: NewDirectListing,
  ): Promise<BigNumber> {
    this.validateNewListingParam(listing);

    await this.handleTokenApproval(
      listing.assetContractAddress,
      listing.tokenId,
      await this.getSignerAddress(),
    );

    const receipt = await this.sendTransaction("createListing", [
      {
        assetContract: listing.assetContractAddress,
        tokenId: listing.tokenId,
        buyoutPricePerToken: listing.buyoutPricePerToken,
        currencyToAccept: listing.currencyContractAddress,
        listingType: ListingType.Direct,
        quantityToList: listing.quantity,
        reservePricePerToken: listing.buyoutPricePerToken,
        secondsUntilEndTime: listing.listingDurationInSeconds,
        startTime: listing.startTimeInSeconds,
      } as ListingParametersStruct,
    ]);

    const event = this.parseEventLogs("NewListing", receipt?.logs);
    return event.listingId;
  }

  public async createAuctionListing(
    listing: NewAuctionListing,
  ): Promise<BigNumber> {
    this.validateNewListingParam(listing);

    await this.handleTokenApproval(
      listing.assetContractAddress,
      listing.tokenId,
      await this.getSignerAddress(),
    );

    const receipt = await this.sendTransaction("createListing", [
      {
        assetContract: listing.assetContractAddress,
        tokenId: listing.tokenId,
        buyoutPricePerToken: listing.buyoutPricePerToken,
        currencyToAccept: listing.currencyContractAddress,
        listingType: ListingType.Auction,
        quantityToList: listing.quantity,
        reservePricePerToken: listing.reservePricePerToken,
        secondsUntilEndTime: listing.listingDurationInSeconds,
        startTime: listing.startTimeInSeconds,
      } as ListingParametersStruct,
    ]);

    const event = this.parseEventLogs("NewListing", receipt?.logs);
    return event.listingId;
  }

  public async makeOffer(offer: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    pricePerToken: BigNumberish;
  }): Promise<void> {
    try {
      await this.getDirectListing(offer.listingId);
    } catch (err) {
      console.error("Failed to get listing, err =", err);
      throw new Error(`Error getting the listing with id ${offer.listingId}`);
    }

    const quantity = BigNumber.from(offer.quantityDesired);
    const value = BigNumber.from(offer.pricePerToken).mul(quantity);
    const overrides = (await this.getCallOverrides()) || {};
    await this.setAllowance(value, offer.currencyContractAddress, overrides);

    await this.sendTransaction(
      "offer",
      [
        offer.listingId,
        offer.quantityDesired,
        offer.currencyContractAddress,
        offer.pricePerToken,
      ],
      overrides,
    );
  }

  private async setAllowance(
    value: BigNumber,
    currencyAddress: string,
    overrides: any,
  ): Promise<any> {
    if (
      currencyAddress === NATIVE_TOKEN_ADDRESS ||
      currencyAddress === AddressZero
    ) {
      overrides["value"] = value;
    } else {
      const erc20 = ERC20__factory.connect(
        currencyAddress,
        this.providerOrSigner,
      );
      const owner = await this.getSignerAddress();
      const spender = this.address;
      const allowance = await erc20.allowance(owner, spender);

      if (allowance.lt(value)) {
        await this.sendContractTransaction(erc20, "increaseAllowance", [
          spender,
          value.sub(allowance),
        ]);
      }
      return overrides;
    }
  }

  public async makeBid(bid: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    pricePerToken: BigNumberish;
  }): Promise<void> {
    const listing = await this.validateAuctionListing(
      BigNumber.from(bid.listingId),
    );

    const bidBuffer = await this.getBidBufferBps();
    const winningBid = await this.getWinningBid(bid.listingId);
    if (winningBid) {
      const isWinningBid = await this.isWinningBid(
        winningBid.pricePerToken,
        bid.pricePerToken,
        bidBuffer,
      );

      invariant(
        isWinningBid,
        "Bid price is too low based on the current winning bid and the bid buffer",
      );
    } else {
      const pricePerToken = BigNumber.from(bid.pricePerToken);
      const reservePrice = BigNumber.from(listing.reservePrice);
      invariant(
        pricePerToken.gte(reservePrice),
        "Bid price is too low based on reserve price",
      );
    }

    const quantity = BigNumber.from(bid.quantityDesired);
    const value = BigNumber.from(bid.pricePerToken).mul(quantity);

    const overrides = (await this.getCallOverrides()) || {};
    await this.setAllowance(value, bid.currencyContractAddress, overrides);

    await this.sendTransaction(
      "offer",
      [
        bid.listingId,
        bid.quantityDesired,
        bid.currencyContractAddress,
        bid.pricePerToken,
      ],
      overrides,
    );
  }

  public async isWinningBid(
    winningPrice: BigNumberish,
    newBidPrice: BigNumberish,
    bidBuffer: BigNumberish,
  ): Promise<boolean> {
    bidBuffer = BigNumber.from(bidBuffer);
    winningPrice = BigNumber.from(winningPrice);
    newBidPrice = BigNumber.from(newBidPrice);
    const buffer = newBidPrice.sub(winningPrice).mul(MAX_BPS).div(winningPrice);
    return buffer.gt(bidBuffer);
  }

  public async getDirectListing(
    listingId: BigNumberish,
  ): Promise<DirectListing> {
    const listing = await this.readOnlyContract.listings(listingId);

    if (listing.listingId.toString() !== listingId.toString()) {
      throw new ListingNotFoundError(this.address, listingId.toString());
    }

    if (listing.listingType !== ListingType.Direct) {
      throw new WrongListingTypeError(
        this.address,
        listingId.toString(),
        "Auction",
        "Direct",
      );
    }

    return {
      assetContractAddress: listing.assetContract,
      buyoutPrice: listing.buyoutPricePerToken,
      currencyContractAddress: listing.currency,
      buyoutCurrencyValuePerToken: await getCurrencyValue(
        this.providerOrSigner,
        listing.currency,
        listing.buyoutPricePerToken,
      ),
      id: listingId.toString(),
      tokenId: listing.tokenId,
      quantity: listing.quantity,
      startTimeInSeconds: listing.startTime,
      asset: undefined,
      secondsUntilEnd: listing.endTime,
    };
  }

  public async getAuctionListing(
    listingId: BigNumberish,
  ): Promise<AuctionListing> {
    const listing = await this.readOnlyContract.listings(listingId);

    if (listing.listingId.toString() !== listingId.toString()) {
      throw new ListingNotFoundError(this.address, listingId.toString());
    }

    if (listing.listingType !== ListingType.Auction) {
      throw new WrongListingTypeError(
        this.address,
        listingId.toString(),
        "Direct",
        "Auction",
      );
    }

    return {
      assetContractAddress: listing.assetContract,
      buyoutPrice: listing.buyoutPricePerToken,
      currencyContractAddress: listing.currency,
      buyoutCurrencyValuePerToken: await getCurrencyValue(
        this.providerOrSigner,
        listing.currency,
        listing.buyoutPricePerToken,
      ),
      id: listingId.toString(),
      tokenId: listing.tokenId,
      quantity: listing.quantity,
      startTimeInSeconds: listing.startTime,
      asset: undefined,
      reservePriceCurrencyValuePerToken: await getCurrencyValue(
        this.providerOrSigner,
        listing.currency,
        listing.reservePricePerToken,
      ),
      reservePrice: listing.reservePricePerToken,
      secondsUntilEnd: listing.endTime,
    };
  }

  private async handleTokenApproval(
    assetContract: string,
    tokenId: BigNumberish,
    from: string,
  ): Promise<void> {
    const erc165 = ERC165__factory.connect(
      assetContract,
      this.providerOrSigner,
    );

    // check for token approval
    const isERC721 = await erc165.supportsInterface(InterfaceId_IERC721);
    if (isERC721) {
      const asset = ERC721__factory.connect(
        assetContract,
        this.providerOrSigner,
      );

      const approved = await asset.isApprovedForAll(from, this.address);
      if (!approved) {
        const isTokenApproved =
          (await asset.getApproved(tokenId)).toLowerCase() ===
          this.address.toLowerCase();

        if (!isTokenApproved) {
          await this.sendContractTransaction(asset, "setApprovalForAll", [
            this.address,
            true,
          ]);
        }
      }
    } else {
      const asset = ERC1155__factory.connect(
        assetContract,
        this.providerOrSigner,
      );

      const approved = await asset.isApprovedForAll(from, this.address);
      if (!approved) {
        await this.sendContractTransaction(asset, "setApprovalForAll", [
          this.address,
          true,
        ]);
      }
    }
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
      currencyValue: await getCurrencyValue(
        this.providerOrSigner,
        offer.currency,
        (offer.quantityWanted as BigNumber).mul(
          offer.pricePerToken as BigNumber,
        ),
      ),
      listingId,
    } as Offer;
  }

  public async getActiveOffer(
    listingId: BigNumberish,
    address: string,
  ): Promise<Offer | undefined> {
    this.validateDirectListing(BigNumber.from(listingId));
    invariant(isAddress(address), "Address must be a valid address");
    const offers = await this.readOnlyContract.offers(listingId, address);
    if (offers.offeror === AddressZero) {
      return undefined;
    }
    return await this.mapOffer(BigNumber.from(listingId), offers);
  }

  public async getWinningBid(
    listingId: BigNumberish,
  ): Promise<Offer | undefined> {
    this.validateAuctionListing(BigNumber.from(listingId));
    const offers = await this.readOnlyContract.winningBid(listingId);
    if (offers.offeror === AddressZero) {
      return undefined;
    }
    return await this.mapOffer(BigNumber.from(listingId), offers);
  }

  public async getBidBufferBps(): Promise<BigNumber> {
    return this.readOnlyContract.bidBufferBps();
  }

  public async getTimeBufferInSeconds(): Promise<BigNumber> {
    return await this.readOnlyContract.timeBuffer();
  }

  public async acceptWinningBid(listingId: BigNumberish): Promise<void> {
    this.validateAuctionListing(BigNumber.from(listingId));

    const winningBid = await this.getWinningBid(listingId);
    invariant(winningBid !== undefined, "No winning bid found");

    await this.sendTransaction("closeAuction", [
      listingId,
      winningBid.buyerAddress,
    ]);
  }

  public async acceptDirectListingOffer(
    listingId: BigNumberish,
    addressOfOfferor: string,
  ): Promise<void> {
    /**
     * TODO:
     * - Provide better error handling if offer is too lower.
     */

    this.validateDirectListing(BigNumber.from(listingId));
    await this.sendTransaction("acceptOffer", [listingId, addressOfOfferor]);
  }

  /**
   *
   * @beta - This method is not yet ready for production use
   */
  public async buyoutAuction(_buyout: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async buyoutDirectListing(_buyout: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
  }): Promise<void> {
    const listing = await this.validateDirectListing(
      BigNumber.from(_buyout.listingId),
    );

    const quantity = BigNumber.from(_buyout.quantityDesired);
    const value = BigNumber.from(listing.buyoutPrice).mul(quantity);
    const overrides = (await this.getCallOverrides()) || {};
    await this.setAllowance(value, listing.currencyContractAddress, overrides);
    await this.sendTransaction("buy", [_buyout.listingId, quantity], overrides);
  }

  // TODO: Complete method implementation with subgraph
  // /**
  //  *
  //  * @beta - This method is not yet ready for production use
  //  *
  //  * @param _listingId - The listing ID to get active bids for
  //  */
  // public async getActiveBids(_listingId: BigNumberish): Promise<Offer[]> {
  //   throw new Error("Method not implemented.");
  // }

  public async updateDirectListing(listing: DirectListing): Promise<void> {
    await this.sendTransaction("updateListing", [
      listing.id,
      listing.quantity,
      // eslint-disable-next-line line-comment-position
      listing.buyoutPrice, // reserve price, doesn't matter for direct listing
      listing.buyoutPrice,
      listing.currencyContractAddress,
      listing.startTimeInSeconds,
      listing.secondsUntilEnd,
    ]);
  }

  public async updateAuctionListing(listing: AuctionListing): Promise<void> {
    await this.sendTransaction("updateListing", [
      listing.id,
      listing.quantity,
      listing.reservePrice,
      listing.buyoutPrice,
      listing.currencyContractAddress,
      listing.startTimeInSeconds,
      listing.secondsUntilEnd,
    ]);
  }

  public async cancelDirectListing(listingId: BigNumberish): Promise<void> {
    const listing = await this.validateDirectListing(BigNumber.from(listingId));
    listing.quantity = 0;
    await this.updateDirectListing(listing);
  }

  public async cancelAuctionListing(listingId: BigNumberish): Promise<void> {
    const listing = await this.validateAuctionListing(
      BigNumber.from(listingId),
    );

    const now = BigNumber.from(Math.floor(Date.now() / 1000));
    const startTime = BigNumber.from(listing.startTimeInSeconds);

    if (now.gt(startTime)) {
      throw new AuctionAlreadyStartedError(listingId.toString());
    }

    await this.sendTransaction("closeAuction", [
      BigNumber.from(listingId),
      await this.getSignerAddress(),
    ]);
  }

  public async closeAuctionListing(_listingId: BigNumberish): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
