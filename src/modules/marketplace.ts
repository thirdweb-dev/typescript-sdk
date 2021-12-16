import { ListingType } from "./../enums/marketplace/ListingType";
import {
  ERC1155__factory,
  ERC165__factory,
  ERC721__factory,
  Marketplace,
  Marketplace__factory,
} from "@3rdweb/contracts";
import { ListingParametersStruct } from "@3rdweb/contracts/dist/IMarketplace";
import { BigNumberish } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { InterfaceId_IERC721, ModuleType, Role, RolesMap } from "../common";
import { invariant } from "../common/invariant";
import { ModuleWithRoles } from "../core/module";
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
  ): Promise<BigNumberish> {
    invariant(
      isAddress(listing.currencyContractAddress),
      `Invalid currency contract address = ${listing.currencyContractAddress}`,
    );

    await this.handleTokenApproval(
      listing.assetContractAddress,
      listing.tokenId,
      await this.getSignerAddress(),
    );

    const receipt = await this.sendTransaction("createListing", [
      {
        assetContract: listing.assetContractAddress,
        tokenId: listing.tokenId,
        buyoutPricePerToken: listing.buyoutPrice,
        currencyToAccept: listing.currencyContractAddress,
        listingType: ListingType.Direct,
        quantityToList: listing.quantity,
        reservePricePerToken: listing.buyoutPrice,
        secondsUntilEndTime: listing.listingDurationInSeconds,
        startTime: listing.startTimeInSeconds,
      } as ListingParametersStruct,
    ]);

    const event = this.parseEventLogs("NewListing", receipt?.logs);
    return event.listingId;
  }

  public async createAuctionListing(
    listing: NewAuctionListing,
  ): Promise<BigNumberish> {
    throw new Error("Method not implemented.");
  }
  updateDirectListing(listing: AuctionListing): Promise<DirectListing> {
    throw new Error("Method not implemented.");
  }
  updateAuctionListing(listing: AuctionListing): Promise<AuctionListing> {
    throw new Error("Method not implemented.");
  }
  makeOffer(offer: {
    listingId: BigNumberish;
    quantityDesired: BigNumberish;
    currencyContractAddress: string;
    tokenAmount: BigNumberish;
  }): Promise<void> {
    throw new Error("Method not implemented.");
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
  getDirectListing(listingId: BigNumberish): Promise<DirectListing> {
    throw new Error("Method not implemented.");
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
}
