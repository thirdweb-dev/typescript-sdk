import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish } from "ethers";
import { ModuleType } from "../common";
import { InterfaceId_IERC721 } from "../common/contract";
import { CurrencyValue, getCurrencyValue } from "../common/currency";
import { uploadMetadata } from "../common/ipfs";
import { getMetadataWithoutContract, NFTMetadata } from "../common/nft";
import { Module } from "../core/module";
import {
  ERC1155__factory,
  ERC165__factory,
  ERC20__factory,
  ERC721__factory,
  Market,
  Market__factory,
} from "../types";

interface ListingFilter {
  seller?: string;
  tokenContract?: string;
  tokenId?: string;
}

interface Listing {
  id: string;
  seller: string;
  tokenContract: string;
  tokenId: string;
  tokenMetadata?: NFTMetadata;
  quantity: BigNumber;
  currencyContract: string;
  currencyMetadata: CurrencyValue | null;
  price: BigNumber;
  saleStart: Date | null;
  saleEnd: Date | null;
}

/**
 * The MarketModule. This should always be created via `getMarketModule()` on the main SDK.
 * @public
 */
export class MarketModule extends Module {
  public static moduleType: ModuleType = ModuleType.MARKET;

  private __contract: Market | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): Market {
    return this.__contract || this.connectContract();
  }
  private set contract(value: Market) {
    this.__contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): Market {
    return (this.contract = Market__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  private async transformResultToListing(listing: any): Promise<Listing> {
    let currency: CurrencyValue | null = null;

    try {
      currency = await getCurrencyValue(
        this.providerOrSigner,
        listing.currency,
        listing.pricePerToken,
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}

    let metadata: NFTMetadata | undefined = undefined;
    try {
      metadata = await getMetadataWithoutContract(
        this.providerOrSigner,
        listing.assetContract,
        listing.tokenId.toString(),
        this.ipfsGatewayUrl,
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}

    return {
      id: listing.listingId.toString(),
      seller: listing.seller,
      tokenId: listing.tokenId.toString(),
      tokenContract: listing.assetContract,
      tokenMetadata: metadata,
      quantity: listing.quantity,
      price: listing.pricePerToken,
      currencyContract: listing.currency,
      currencyMetadata: currency,
      saleStart: listing.saleStart.gt(0)
        ? new Date(listing.saleStart.toNumber() * 1000)
        : null,
      saleEnd:
        listing.saleEnd.gt(0) &&
        listing.saleEnd.lte(Number.MAX_SAFE_INTEGER - 1)
          ? new Date(listing.saleEnd.toNumber() * 1000)
          : null,
    };
  }

  public async get(listingId: string): Promise<Listing> {
    const listing = await this.contract.listings(listingId);
    return await this.transformResultToListing(listing);
  }

  public async getAll(filter?: ListingFilter): Promise<Listing[]> {
    let listings: any[] = [];

    if (!filter) {
      listings = listings.concat(await this.contract.getAllListings());
    } else {
      if (filter.tokenContract && filter.tokenId) {
        listings = listings.concat(
          await this.contract.getListingsByAsset(
            filter.tokenContract,
            filter.tokenId,
          ),
        );
      } else if (filter.seller) {
        listings = listings.concat(
          await this.contract.getListingsBySeller(filter.seller),
        );
      } else if (filter.tokenContract) {
        listings = listings.concat(
          await this.contract.getListingsByAssetContract(filter.tokenContract),
        );
      } else {
        listings = listings.concat(await this.contract.getAllListings());
      }
    }

    listings = listings
      .filter((l) => {
        if (l.quantity.eq(0)) {
          return false;
        }
        if (filter) {
          const filterSeller = filter?.seller || "";
          const filterTokenContract = filter?.tokenContract || "";
          const filterTokenId = filter?.tokenId || "";

          if (
            filterSeller &&
            filterSeller.toLowerCase() !== l.seller.toLowerCase()
          ) {
            return false;
          }
          if (
            filterTokenContract &&
            filterTokenContract.toLowerCase() !== l.assetContract.toLowerCase()
          ) {
            return false;
          }
          if (
            filterTokenId &&
            filterTokenId.toLowerCase() !== l.tokenId.toString().toLowerCase()
          ) {
            return false;
          }
        }
        return true;
      })
      .map((l) => this.transformResultToListing(l));
    return await Promise.all(listings);
  }

  public async list(
    assetContract: string,
    tokenId: string,
    currencyContract: string,
    price: BigNumber,
    quantity: BigNumber,
    secondsUntilStart = 0,
    secondsUntilEnd = 0,
  ): Promise<Listing> {
    const from = await this.getSignerAddress();
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
          const tx = await asset.setApprovalForAll(this.address, true);
          await tx.wait();
        }
      }
    } else {
      const asset = ERC1155__factory.connect(
        assetContract,
        this.providerOrSigner,
      );

      const approved = await asset.isApprovedForAll(from, this.address);
      if (!approved) {
        const tx = await asset.setApprovalForAll(this.address, true);
        await tx.wait();
      }
    }

    const tx = await this.contract.list(
      assetContract,
      tokenId,
      currencyContract,
      price,
      quantity,
      secondsUntilStart,
      secondsUntilEnd,
    );
    const receipt = await tx.wait();
    const event = receipt?.events?.find((e) => e.event === "NewListing");
    const listing = event?.args?.listing;
    return await this.transformResultToListing(listing);
  }

  public async unlistAll(listingId: string) {
    const maxQuantity = (await this.get(listingId)).quantity;
    await this.unlist(listingId, maxQuantity);
  }

  public async unlist(listingId: string, quantity: BigNumberish) {
    const tx = await this.contract.unlist(listingId, quantity);
    await tx.wait();
  }

  public async buy(
    listingId: string,
    quantity: BigNumberish,
  ): Promise<Listing> {
    const listing = await this.get(listingId);
    const owner = await this.getSignerAddress();
    const spender = this.address;
    const totalPrice = listing.price.mul(BigNumber.from(quantity));
    if (listing.currencyContract && listing.currencyContract !== AddressZero) {
      const erc20 = ERC20__factory.connect(
        listing.currencyContract,
        this.providerOrSigner,
      );
      const allowance = await erc20.allowance(owner, spender);
      if (allowance.lte(totalPrice)) {
        const tx = await erc20.increaseAllowance(spender, totalPrice);
        await tx.wait();
      }
    }
    const tx = await this.contract.buy(listingId, quantity);
    const receipt = await tx.wait();
    const event = receipt?.events?.find((e) => e.event === "NewSale");
    return await this.transformResultToListing(event?.args?.listing);
  }

  // owner functions
  public async setContractURI(metadata: string | Record<string, any>) {
    const uri = await uploadMetadata(metadata);
    const tx = await this.contract.setContractURI(uri);
    await tx.wait();
  }
}
