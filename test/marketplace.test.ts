import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../src/common/currency";
import {
  AuctionAlreadyStartedError,
  ListingNotFoundError,
  WrongListingTypeError,
} from "../src/common/error";
import { ListingType } from "../src/enums/marketplace";
import {
  MarketplaceModule,
  TokenErc1155Module,
  TokenErc20Module,
  TokenErc721Module,
} from "../src/modules";
import { AuctionListing, DirectListing, Offer } from "../src/types/marketplace";
import { fastForwardTime, jsonProvider, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

let tokenAddress = NATIVE_TOKEN_ADDRESS;
let startingBalance = BigNumber.from("10000");

/**
 * Throughout these tests, the admin wallet will be the deployer
 * and lister of all listings.
 *
 * Bog and Sam and Abby wallets will be used for direct listings and auctions.
 */
describe("Marketplace Module", async () => {
  let marketplaceModule: MarketplaceModule;
  let dummyNftModule: TokenErc721Module;
  let dummyBundleModule: TokenErc1155Module;
  let customTokenModule: TokenErc20Module;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    abbyWallet: SignerWithAddress,
    bobWallet: SignerWithAddress,
    w1: SignerWithAddress,
    w2: SignerWithAddress,
    w3: SignerWithAddress,
    w4: SignerWithAddress;

  beforeEach(async () => {
    await jsonProvider.send("hardhat_reset", []);
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;

    await sdk.updateSignerOrProvider(adminWallet);

    marketplaceModule = sdk.getMarketplaceModule(
      await sdk.factory.deploy(MarketplaceModule.moduleType, {
        name: "Test Marketplace",
        seller_fee_basis_points: 0,
      }),
    );
    dummyNftModule = sdk.getNFTModule(
      await sdk.factory.deploy(TokenErc721Module.moduleType, {
        name: "TEST NFT",
        seller_fee_basis_points: 100,
      }),
    );
    await dummyNftModule.mintBatch([
      {
        name: "Test 0",
      },
      {
        name: "Test 2",
      },
      {
        name: "Test 3",
      },
      {
        name: "Test 4",
      },
    ]);
    dummyBundleModule = sdk.getBundleModule(
      await sdk.factory.deploy(TokenErc1155Module.moduleType, {
        name: "TEST BUNDLE",
        seller_fee_basis_points: 100,
      }),
    );
    await dummyBundleModule.mintBatch([
      {
        metadata: {
          name: "Test 0",
        },
        supply: 100000,
      },
      {
        metadata: {
          name: "Test 1",
        },
        supply: 100000,
      },
    ]);

    customTokenModule = sdk.getTokenModule(
      await sdk.factory.deploy(TokenErc20Module.moduleType, {
        name: "Test",
        symbol: "TEST",
      }),
    );
    await customTokenModule.mintBatchTo([
      {
        toAddress: bobWallet.address,
        amount: ethers.utils.parseUnits("1000000000000000000000"),
      },
      {
        toAddress: samWallet.address,
        amount: ethers.utils.parseUnits("100000000000000000000"),
      },
      {
        toAddress: adminWallet.address,
        amount: ethers.utils.parseUnits("100000000000000000000"),
      },
    ]);
    tokenAddress = customTokenModule.getAddress();
    startingBalance = BigNumber.from("100000000000000000000");
  });

  const createDirectListing = async (
    contractAddress: string,
    tokenId: BigNumberish,
    quantity: BigNumberish = 1,
  ): Promise<BigNumber> => {
    return (
      await marketplaceModule.createDirectListing({
        assetContractAddress: contractAddress,
        buyoutPricePerToken: ethers.utils.parseUnits("10"),
        currencyContractAddress: tokenAddress,
        startTimeInSeconds: Math.floor(Date.now() / 1000),
        listingDurationInSeconds: 60 * 60 * 24,
        tokenId,
        quantity,
      })
    ).id;
  };

  const createAuctionListing = async (
    contractAddress: string,
    tokenId: BigNumberish,
    quantity: BigNumberish = 1,
    startTime: number = Math.floor(Date.now() / 1000),
  ): Promise<BigNumber> => {
    return (
      await marketplaceModule.createAuctionListing({
        assetContractAddress: contractAddress,
        buyoutPricePerToken: ethers.utils.parseUnits("10"),
        currencyContractAddress: tokenAddress,
        startTimeInSeconds: startTime,
        listingDurationInSeconds: 60 * 60 * 24,
        tokenId,
        quantity,
        reservePricePerToken: ethers.utils.parseUnits("1"),
      })
    ).id;
  };

  const provider = ethers.getDefaultProvider();
  const checkTokenBalance = async (address: string): Promise<BigNumber> => {
    if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
      return provider.getBalance(address);
    } else {
      const balance = await customTokenModule.balanceOf(address);
      return BigNumber.from(balance.value);
    }
  };

  describe("Listing", () => {
    it("should list direct listings with 721s", async () => {
      const listingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      assert.isDefined(listingId);
    });

    it("should list direct listings with 1155s", async () => {
      const listingId = await createDirectListing(
        dummyBundleModule.getAddress(),
        0,
        10,
      );
      assert.isDefined(listingId);
    });

    it("should list auction listings with 721s", async () => {
      const listingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        0,
      );
      assert.isDefined(listingId);
    });

    it("should list auction listings with 1155s", async () => {
      const listingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        0,
        10,
      );
      assert.isDefined(listingId);
    });
  });

  describe("Listing Filters", () => {
    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      await createDirectListing(dummyNftModule.getAddress(), 0);
      await createAuctionListing(dummyNftModule.getAddress(), 1);

      await createDirectListing(dummyBundleModule.getAddress(), 0, 10);
      await createAuctionListing(dummyBundleModule.getAddress(), 0, 10);

      await dummyBundleModule.transfer(samWallet.address, "0", 10);
      await dummyBundleModule.transfer(samWallet.address, "1", 10);

      await sdk.updateSignerOrProvider(samWallet);
      await createDirectListing(dummyBundleModule.getAddress(), 0, 10);
      await createAuctionListing(dummyBundleModule.getAddress(), 1, 10);
    });

    it("should paginate properly", async () => {
      const listings = await marketplaceModule.getAllListings({
        start: 0,
        count: 1,
      });
      assert.equal(listings.length, 1, "pagination doesn't work");
    });

    it("should filter sellers properly", async () => {
      const listings = await marketplaceModule.getAllListings({
        seller: adminWallet.address,
      });
      assert.equal(listings.length, 4, "seller filter doesn't work");
    });

    it("should filter asset contract properly", async () => {
      const listings = await marketplaceModule.getAllListings({
        tokenContract: dummyBundleModule.getAddress(),
      });
      assert.equal(listings.length, 4, "seller filter doesn't work");
    });

    it("should filter asset contract with token id properly", async () => {
      const listings = await marketplaceModule.getAllListings({
        tokenContract: dummyNftModule.getAddress(),
        tokenId: 0,
      });
      assert.equal(listings.length, 2, "seller filter doesn't work");
    });
  });

  describe("Get Listing", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      auctionListingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        1,
      );
    });

    it("should return an auction listing", async () => {
      const listing = (await marketplaceModule.getListing(
        auctionListingId,
      )) as AuctionListing;
      assert.equal(listing.type.toString(), ListingType.Auction.toString());
      assert.equal(listing.tokenId.toString(), "1");

      assert.equal(listing.asset.id, "1");
      assert.equal(listing.asset.name, "Test 2");
    });

    it("should return an auction listing", async () => {
      const listings = await marketplaceModule.getAllListings();
      assert(listings.length > 0);
    });

    it("should return a direct listing", async () => {
      const listing = (await marketplaceModule.getListing(
        directListingId,
      )) as DirectListing;
      assert.equal(listing.type.toString(), ListingType.Direct.toString());
      assert.equal(listing.tokenId.toString(), "0");

      assert.equal(listing.asset.id, "0");
      assert.equal(listing.asset.name, "Test 0");
    });

    it("should return a direct listing using getDirectListing", async () => {
      const listing = await marketplaceModule.getDirectListing(directListingId);
      assert.equal(listing.type.toString(), ListingType.Direct.toString());
      assert.equal(listing.tokenId.toString(), "0");
    });

    it("should return a direct listing using getAuctionListing", async () => {
      const listing = await marketplaceModule.getAuctionListing(
        auctionListingId,
      );
      assert.equal(listing.type.toString(), ListingType.Auction.toString());
      assert.equal(listing.tokenId.toString(), "1");
    });
  });

  describe("Offers", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    let directListingIdMultiple: BigNumber;
    let auctionListingIdMultiple: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      auctionListingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        1,
      );

      directListingIdMultiple = await createDirectListing(
        dummyBundleModule.getAddress(),
        0,
        10,
      );
      auctionListingIdMultiple = await createAuctionListing(
        dummyBundleModule.getAddress(),
        0,
        10,
      );
    });

    it("should allow the seller to accept an offer", async () => {
      await sdk.updateSignerOrProvider(bobWallet);

      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );

      await marketplaceModule.makeDirectListingOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("8"),
      });

      console.log("Offer made");

      await sdk.updateSignerOrProvider(adminWallet);
      await marketplaceModule.acceptDirectListingOffer(
        directListingId,
        bobWallet.address,
      );

      console.log("Offer accepted");

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );
    });

    it("should allow a buyer to buyout a direct listing", async () => {
      await sdk.updateSignerOrProvider(bobWallet);

      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.buyoutDirectListing({
        listingId: directListingId,
        quantityDesired: 1,
      });
      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );
    });

    it("should allow offers to be made on direct listings", async () => {
      await sdk.updateSignerOrProvider(bobWallet);
      await marketplaceModule.makeDirectListingOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("1"),
      });

      const offer = (await marketplaceModule.getActiveOffer(
        directListingId,
        bobWallet.address,
      )) as Offer;

      assert.equal(offer.buyerAddress, bobWallet.address);
      assert.equal(
        offer.pricePerToken.toString(),
        ethers.utils.parseUnits("1").toString(),
      );
      assert.equal(offer.listingId.toString(), directListingId.toString());

      await sdk.updateSignerOrProvider(samWallet);
      await marketplaceModule.makeDirectListingOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("1"),
      });

      const secondOffer = (await marketplaceModule.getActiveOffer(
        directListingId,
        samWallet.address,
      )) as Offer;

      assert.equal(secondOffer.buyerAddress, samWallet.address);
      assert.equal(
        offer.pricePerToken.toString(),
        ethers.utils.parseUnits("1").toString(),
      );
      assert.equal(offer.listingId.toString(), directListingId.toString());
    });

    it("should return undefined when checking offers on an address that hasn't made any", async () => {
      const offer = await marketplaceModule.getActiveOffer(
        directListingId,
        adminWallet.address,
      );
      assert.isUndefined(offer);
    });

    it("should allow bids to be made on auction listings", async () => {
      await sdk.updateSignerOrProvider(bobWallet);
      await marketplaceModule.makeAuctionListingBid({
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("1"),
      });

      let winningBid = (await marketplaceModule.getWinningBid(
        auctionListingId,
      )) as Offer;

      assert.equal(winningBid.buyerAddress, bobWallet.address);
      assert.equal(
        winningBid.pricePerToken.toString(),
        ethers.utils.parseUnits("1").toString(),
      );
      assert.equal(
        winningBid.listingId.toString(),
        auctionListingId.toString(),
      );

      // Make a higher winning bid
      await sdk.updateSignerOrProvider(samWallet);
      await marketplaceModule.makeAuctionListingBid({
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });

      winningBid = (await marketplaceModule.getWinningBid(
        auctionListingId,
      )) as Offer;
      assert.equal(winningBid.buyerAddress, samWallet.address);
      assert.equal(
        winningBid.pricePerToken.toString(),
        ethers.utils.parseUnits("2").toString(),
      );
      assert.equal(
        winningBid.listingId.toString(),
        auctionListingId.toString(),
      );
    });
  });

  describe("Validators", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      auctionListingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        1,
      );
    });

    it("should throw an error trying to fetch a listing of the wrong type", async () => {
      try {
        await marketplaceModule.getDirectListing(auctionListingId);
        assert.fail("Should have thrown an error");
      } catch (err) {
        if (!(err instanceof WrongListingTypeError)) {
          throw err;
        }
      }

      try {
        await marketplaceModule.getAuctionListing(directListingId);
        assert.fail("Should have thrown an error");
      } catch (err) {
        if (!(err instanceof WrongListingTypeError)) {
          throw err;
        }
      }
    });
  });

  describe("Bidding", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      auctionListingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        1,
      );
    });

    it("should automatically award a buyout", async () => {
      await sdk.updateSignerOrProvider(bobWallet);
      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.makeAuctionListingBid({
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("20"),
      });

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );
    });

    // TODO: idk if a seller can close out an auction before the auction
    // has ended and so the call to `acceptWinningBid` is failing on this
    // test because the listing is still active.
    it.skip("should allow the seller to accept the winning bid", async () => {
      await sdk.updateSignerOrProvider(bobWallet);
      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.makeAuctionListingBid({
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });

      const winningBid = (await marketplaceModule.getWinningBid(
        auctionListingId,
      )) as Offer;

      assert.equal(
        winningBid.buyerAddress,
        bobWallet.address,
        "Bob should be the winning bidder",
      );

      await sdk.updateSignerOrProvider(bobWallet);
      await marketplaceModule.closeAuctionListing(auctionListingId);
      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );

      // TODO: write test for calling closeAuctionListing with sellers wallet
    });

    it("should throw an error if a bid being placed is not a winning bid", async () => {
      await sdk.updateSignerOrProvider(bobWallet);
      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.makeAuctionListingBid({
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });
      try {
        await marketplaceModule.makeAuctionListingBid({
          listingId: auctionListingId,
          pricePerToken: ethers.utils.parseUnits("2.01"),
        });
        // eslint-disable-next-line no-empty
      } catch (err) {}
    });

    it("should allow an auction buyout", async () => {
      const id = (
        await marketplaceModule.createAuctionListing({
          assetContractAddress: dummyBundleModule.getAddress(),
          buyoutPricePerToken: ethers.utils.parseUnits("10"),
          currencyContractAddress: tokenAddress,
          // to start tomorrow so we can update it
          startTimeInSeconds: Math.floor(Date.now() / 1000),
          listingDurationInSeconds: 60 * 60 * 24,
          tokenId: "1",
          quantity: 2,
          reservePricePerToken: ethers.utils.parseUnits("1"),
        })
      ).id;
      await sdk.updateSignerOrProvider(bobWallet);
      await marketplaceModule.buyoutAuctionListing(id);

      const balance = await dummyBundleModule.balanceOf(bobWallet.address, "1");
      assert.equal(
        balance.toString(),
        "2",
        "The buyer should have no tokens to start",
      );
    });
  });

  describe("Closing listings", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      auctionListingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        1,
      );
    });

    it("should allow a seller to close an auction that hasn't started yet", async () => {
      const id = (
        await marketplaceModule.createAuctionListing({
          assetContractAddress: dummyNftModule.getAddress(),
          buyoutPricePerToken: ethers.utils.parseUnits("10"),
          currencyContractAddress: tokenAddress,
          // to start tomorrow so we can update it
          startTimeInSeconds: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
          listingDurationInSeconds: 60 * 60 * 24,
          tokenId: "0",
          quantity: 1,
          reservePricePerToken: ethers.utils.parseUnits("1"),
        })
      ).id;
      await marketplaceModule.cancelAuctionListing(id);

      try {
        await marketplaceModule.getAuctionListing(id);
      } catch (err) {
        if (!(err instanceof ListingNotFoundError)) {
          throw err;
        }
      }
    });

    it("should not throw an error when trying to close an auction that already started (no bids)", async () => {
      await marketplaceModule.cancelAuctionListing(auctionListingId);
    });

    it("should throw an error when trying to close an auction that already started (with bids)", async () => {
      await marketplaceModule.makeAuctionListingBid({
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });
      try {
        await marketplaceModule.cancelAuctionListing(auctionListingId);
        assert.fail("should have thrown an error");
      } catch (err: any) {
        if (
          !(err instanceof AuctionAlreadyStartedError) &&
          !(err.message as string).includes(
            "cannot close auction before it has ended",
          )
        ) {
          throw err;
        }
      }
    });

    it("should correctly close a direct listing", async () => {
      const listing = await marketplaceModule.getDirectListing(directListingId);
      assert.equal(listing.quantity.toString(), "1");
      await marketplaceModule.cancelDirectListing(directListingId);
      try {
        await marketplaceModule.getDirectListing(directListingId);
      } catch (e) {
        if (!(e instanceof ListingNotFoundError)) {
          throw e;
        }
      }
    });

    // Skipping until decision is made on this:
    // https://github.com/nftlabs/nftlabs-sdk-ts/issues/119#issuecomment-1003199128
    it.skip("should allow the seller to cancel an auction that has started as long as there are no active bids", async () => {
      const startTime = Math.floor(Date.now() / 1000) - 10000;
      const listingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        2,
        1,
        startTime,
      );

      const listing = await marketplaceModule.getAuctionListing(listingId);
      const winningBid = await marketplaceModule.getWinningBid(listingId);

      try {
        await marketplaceModule.cancelAuctionListing(auctionListingId);
        // eslint-disable-next-line no-empty
      } catch (err) {
        console.error("failed to cancel listing", err);
        assert.fail(
          "The seller should be able to cancel the auction if there are no active bids",
        );
      }
    });

    it("should distribute the tokens when a listing closes", async () => {
      const now = Math.floor(Date.now() / 1000);
      await sdk.updateSignerOrProvider(adminWallet);
      const listingId = (
        await marketplaceModule.createAuctionListing({
          assetContractAddress: dummyNftModule.getAddress(),
          buyoutPricePerToken: ethers.utils.parseUnits("10"),
          currencyContractAddress: tokenAddress,
          startTimeInSeconds: now,
          listingDurationInSeconds: 60 * 60,
          tokenId: "2",
          quantity: "1",
          reservePricePerToken: ethers.utils.parseUnits("1"),
        })
      ).id;

      await sdk.updateSignerOrProvider(bobWallet);

      await marketplaceModule.makeAuctionListingBid({
        listingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });

      await fastForwardTime(60 * 60 * 24);

      /**
       * Buyer
       */
      const oldBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        oldBalance.toString(),
        "0",
        "The buyer should have no tokens to start",
      );
      await marketplaceModule.closeAuctionListing(listingId);

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );

      /**
       * Seller
       */
      await sdk.updateSignerOrProvider(adminWallet);
      const oldTokenBalance = await customTokenModule.balanceOf(
        adminWallet.address,
      );
      assert.deepEqual(
        oldTokenBalance.value,
        ethers.utils.parseUnits("100000000000000000000"),
        "The buyer should have 100000000000000000000 tokens to start",
      );

      await marketplaceModule.closeAuctionListing(listingId);

      const newTokenBalance = await customTokenModule.balanceOf(
        adminWallet.address,
      );
      assert.deepEqual(
        newTokenBalance.value,
        ethers.utils
          .parseUnits("100000000000000000000")
          // eslint-disable-next-line line-comment-position
          .add(ethers.utils.parseUnits("1.97")), // 3% taken out for royalties
        "The buyer should have two additional tokens after the listing closes",
      );
    });
  });

  describe("Updating listings", () => {
    let directListingId: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
    });

    it("should allow you to update a direct listing", async () => {
      const buyoutPrice = ethers.utils.parseUnits("10");

      const directListing = await marketplaceModule.getDirectListing(
        directListingId,
      );
      assert.equal(
        directListing.buyoutPrice.toString(),
        buyoutPrice.toString(),
      );

      directListing.buyoutPrice = ethers.utils.parseUnits("20");

      await marketplaceModule.updateDirectListing(directListing);

      const updatedListing = await marketplaceModule.getDirectListing(
        directListingId,
      );
      assert.equal(
        updatedListing.buyoutPrice.toString(),
        ethers.utils.parseUnits("20").toString(),
      );
    });

    it("should allow you to update an auction listing", async () => {
      const buyoutPrice = ethers.utils.parseUnits("10");

      const id = (
        await marketplaceModule.createAuctionListing({
          assetContractAddress: dummyNftModule.getAddress(),
          buyoutPricePerToken: ethers.utils.parseUnits("10"),
          currencyContractAddress: tokenAddress,
          // to start tomorrow so we can update it
          startTimeInSeconds: Math.floor(Date.now() / 1000 + 60 * 60 * 100000),
          listingDurationInSeconds: 60 * 60 * 24,
          tokenId: "0",
          quantity: 1,
          reservePricePerToken: ethers.utils.parseUnits("1"),
        })
      ).id;

      const auctionListing = await marketplaceModule.getAuctionListing(id);
      assert.equal(
        auctionListing.buyoutPrice.toString(),
        buyoutPrice.toString(),
      );

      auctionListing.buyoutPrice = ethers.utils.parseUnits("9");

      await marketplaceModule.updateAuctionListing(auctionListing);

      const updatedListing = await marketplaceModule.getAuctionListing(id);
      assert.equal(
        updatedListing.buyoutPrice.toString(),
        ethers.utils.parseUnits("9").toString(),
      );
    });
  });

  describe("Utils", async () => {
    // TODO rewrite this test to actually try to place bids
    it.skip("should return the correct bid buffer rules", async () => {
      const testCases: {
        winningBid: BigNumberish;
        newBid: BigNumberish;
        buffer: BigNumberish;
        valid: boolean;
      }[] = [
        {
          winningBid: 10,
          newBid: 12,
          buffer: 500,
          valid: true,
        },
        {
          winningBid: 100,
          newBid: 101,
          buffer: 500,
          valid: false,
        },
        {
          winningBid: 10,
          newBid: 12,
          buffer: 1000,
          valid: true,
        },
        {
          winningBid: 10,
          newBid: 15,
          buffer: 5001,
          valid: false,
        },
        {
          winningBid: 10,
          newBid: 15,
          buffer: 4999,
          valid: true,
        },
        {
          winningBid: 10,
          newBid: 9,
          buffer: 1000,
          valid: false,
        },
      ];

      for (const testCase of testCases) {
        const result = await marketplaceModule.isWinningBid(
          testCase.winningBid,
          testCase.newBid,
          testCase.buffer,
        );
        assert.equal(
          result,
          testCase.valid,
          `should be valid: ${JSON.stringify(testCase)}`,
        );
      }
    });
  });

  describe("Buffers", () => {
    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
    });

    it("should set the correct bid buffer default of 15 minutes", async () => {
      const buffer = await marketplaceModule.getTimeBufferInSeconds();
      assert.equal(buffer.toNumber(), 15 * 60);
    });

    it("should set the correct time buffer default of 500 bps", async () => {
      const buffer = await marketplaceModule.getBidBufferBps();
      assert.equal(buffer.toNumber(), 500);
    });

    it("should allow you to set the bid buffer", async () => {
      await marketplaceModule.setBidBufferBps(1000);
      const buffer = await marketplaceModule.getBidBufferBps();
      assert.equal(buffer.toNumber(), 1000);
    });

    it("should allow you to set the time buffer", async () => {
      await marketplaceModule.setTimeBufferInSeconds(1000);
      const buffer = await marketplaceModule.getTimeBufferInSeconds();
      assert.equal(buffer.toNumber(), 1000);
    });
  });

  describe("Invalid Listings", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      directListingId = await createDirectListing(
        dummyNftModule.getAddress(),
        0,
      );
      auctionListingId = await createAuctionListing(
        dummyNftModule.getAddress(),
        1,
      );
    });

    it("should throw an error when trying to buyout an invalid direct listing", async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      await dummyNftModule.transfer(samWallet.address, "0");

      await sdk.updateSignerOrProvider(bobWallet);

      try {
        await marketplaceModule.buyoutDirectListing({
          listingId: directListingId,
          quantityDesired: 1,
        });
        assert.fail("should have thrown");
      } catch (err: any) {
        console.error(err);
      }
    });

    it("should not return invalid direct listings", async () => {
      await sdk.updateSignerOrProvider(adminWallet);
      await dummyNftModule.transfer(samWallet.address, "0");

      const allListings = await marketplaceModule.getAllListings();
      const found = allListings.find(
        (l) => l.id.toString() === directListingId.toString(),
      );
      assert.isUndefined(
        found,
        "should not have found the listing becuase it is invalid",
      );
    });
  });
});
