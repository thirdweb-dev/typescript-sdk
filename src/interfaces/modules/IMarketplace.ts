import { DirectListing } from "./../../types/marketplace/DirectListing";
import { BigNumberish } from "ethers";

import {
  NewDirectListing,
  DirectListing,
  NewAuctionListing,
  AuctionListing,
  Offer,
} from "../../types/marketplace";

export interface IMarketplace {
  /**
   * Creates a new direct listing on a marketplace.
   */
  createDirectListing(listing: NewDirectListing): Promise<DirectListing>;

  /**
   * Creates a new auction listing on a marketplace.
   */
  createAuctionListing(listing: NewAuctionListing): Promise<AuctionListing>;

  /**
   * Make an offer on a direct listing.
   *
   * @param listingId - The listing id.
   */
  makeOffer(listingId: BigNumberish): Promise<void>;

  /**
   * Make an offer on an auction
   *
   * @param listingId - The listing id.
   */
  makeBid(listingId: BigNumberish): Promise<void>;

  /**
   * Remove the listing.
   *
   * @param listingId - Id of the listing to remove.
   */
  removeListing(listingId: BigNumberish): Promise<void>;

  /**
   * Buyout the listing based on the buyout price.
   *
   * @param listingId - Id of the listing to buyout.
   */
  buyout(listingId: BigNumberish): Promise<void>;

  /**
   * Return all active bids for an auction.
   *
   * @param listingId - Id of the listing to get bids for.
   */
  getActiveBids(listingId: BigNumberish): Promise<Offer>;

  /**
   * Fetch a direct listing by Id.
   *
   * @param listingId - Id of the listing to fetch.
   */
  getDirectListing(listingId: BigNumberish): Promise<DirectListing>;

  /**
   * Fetch an auction listing by Id.
   *
   * @param listingId - Id of the listing to fetch.
   */
  getAuctionListing(listingId: BigNumberish): Promise<DirectListing>;
}
