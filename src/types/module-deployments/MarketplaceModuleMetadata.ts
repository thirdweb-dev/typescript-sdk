import {
  JsonObject,
  JsonProperty,
  PropertyConvertingMode,
} from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";

@JsonObject("MarketplaceModuleMetadata")
export class MarketplaceModuleMetadata extends CommonModuleMetadata {
  /**
   * The fee collected on all sales out of this marketplace. This fee
   * only applies to items sold from the marketplace and does not
   * include any resale royalties that occur outside of this marketplace.
   * The default is 0 (no fees).
   *
   * 1 basis point = 0.01%
   *
   * For example: if this value is 100, then the royalty is 1% of the total sales.
   */
  @JsonProperty(
    "seller_fee_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  marketFeeBasisPoints = 0;

  /**
   * This is measured in seconds (e.g. 15 minutes or 900 seconds).
   * If a winning bid is made within the buffer of the auction closing
   * (e.g. 15 minutes within the auction closing), the auction's closing
   * time is increased by the buffer toprevent buyers from making last
   * minute winning bids, and to give time to other buyers to make a
   * higher bid if they wish to.
   */
  @JsonProperty(
    "time_buffer_in_seconds",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  timeBufferInSeconds? = 0;

  /**
   * This is a percentage (e.g. 5%). A new bid is considered to be a winning
   * bid only if its bid amount is at least the bid buffer (e.g. 5%) greater
   * than the previous winning bid. This prevents buyers from making very
   * slightly higher bids to win the auctioned items.
   *
   * This value is formatter as basis points (e.g. 5% = 500).
   */
  @JsonProperty(
    "bid_buffer_in_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  bigBufferInBasisPoints? = 0;
}

export default MarketplaceModuleMetadata;
