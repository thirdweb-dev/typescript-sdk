import { NATIVE_TOKEN_ADDRESS } from "./../common/currency";
import { NewDirectListing } from "./../types/marketplace/NewDirectListing";
import {
  ERC1155__factory,
  ERC165__factory,
  ERC20__factory,
  ERC721__factory,
  Marketplace,
  Marketplace__factory,
} from "@3rdweb/contracts";
import { ListingParametersStruct } from "@3rdweb/contracts/dist/IMarketplace";
import { BigNumber, BigNumberish } from "ethers";
import { isAddress } from "ethers/lib/utils";
import {
  getCurrencyValue,
  InterfaceId_IERC721,
  ModuleType,
  Role,
  RolesMap,
} from "../common";
import { invariant } from "../common/invariant";
import { ModuleWithRoles } from "../core/module";
import { ListingType } from "../enums/marketplace/ListingType";
import { IMarketplace } from "../interfaces/modules";
import {
  AuctionListing,
  DirectListing,
  NewAuctionListing,
  NewDirectListing,
  Offer,
} from "../types";

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
  updateDirectListing(listing: AuctionListing): Promise<DirectListing> {
    throw new Error("Method not implemented.");
  }
  updateAuctionListing(listing: AuctionListing): Promise<AuctionListing> {
    throw new Error("Method not implemented.");
  }

  public async makeOffer(offer: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    pricePerToken: BigNumberish;
  }): Promise<BigNumber> {
    try {
      await this.getDirectListing(offer.listingId);
    } catch (err) {
      console.error(`Error getting the listing with id ${offer.listingId}`);
      throw err;
    }

    const quantity = BigNumber.from(offer.quantityDesired);
    const value = BigNumber.from(offer.pricePerToken).mul(quantity);

    const overrides = (await this.getCallOverrides()) || {};
    this.setAllowance(value, offer.currencyContractAddress, overrides);
    console.log("Allowance set", overrides);

    const receipt = await this.sendTransaction(
      "offer",
      [
        offer.listingId,
        offer.quantityDesired,
        offer.currencyContractAddress,
        offer.pricePerToken,
      ],
      overrides,
    );

    const event = this.parseEventLogs("NewOffer", receipt?.logs);
    console.log(event);
    return event.listingId;
  }

  private async setAllowance(
    value: BigNumber,
    currencyAddress: string,
    overrides: any,
  ): Promise<any> {
    if (currencyAddress === NATIVE_TOKEN_ADDRESS) {
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
        await this.sendContractTransaction(erc20, "approve", [
          spender,
          allowance.add(value),
        ]);
      }
      return overrides;
    }
  }

  makeBid(bid: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    tokenAmount: BigNumberish;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeListing(listingId: BigNumberish): Promise<void> {
    throw new Error("Method not implemented.");
  }
  buyoutAuction(buyout: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    tokenAmount: BigNumberish;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  buyDirectListing(buyout: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    tokenAmount: BigNumberish;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getActiveBids(listingId: BigNumberish): Promise<Offer[]> {
    throw new Error("Method not implemented.");
  }
  acceptWinningBid(listingId: BigNumberish): Promise<void> {
    throw new Error("Method not implemented.");
  }
  acceptDirectListingOffer(
    listingId: BigNumberish,
    addressOfOfferor: string,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async getDirectListing(
    listingId: BigNumberish,
  ): Promise<DirectListing> {
    const listing = await this.readOnlyContract.listings(listingId);

    if (listing.listingId.toString() !== listingId.toString()) {
      throw new Error(`Listing with id ${listingId} not found`);
    }

    if (listing.listingType !== ListingType.Direct) {
      throw new Error(`Listing ${listingId} is not a direct listing`);
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
    };
  }

  getAuctionListing(listingId: BigNumberish): Promise<AuctionListing> {
    throw new Error("Method not implemented.");
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

  public async getActiveOffers(listingId: BigNumberish): Promise<Offer[]> {
    throw new Error("Method not implemented.");
  }

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
}
