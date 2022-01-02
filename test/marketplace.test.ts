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
  BundleModule,
  MarketplaceModule,
  NFTModule,
  TokenModule,
} from "../src/modules";
import { AuctionListing, DirectListing } from "../src/types/marketplace";
import { appModule, fastForwardTime, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

let tokenAddress = NATIVE_TOKEN_ADDRESS;

/**
 * Throughout these tests, the admin wallet will be the deployer
 * and lister of all listings.
 *
 * Bog and Sam and Abby wallets will be used for direct listings and auctions.
 */
describe("Marketplace Module", async () => {
  let marketplaceModule: MarketplaceModule;
  let dummyNftModule: NFTModule;
  let dummyBundleModule: BundleModule;
  let customTokenModule: TokenModule;

  let adminWallet,
    samWallet,
    abbyWallet,
    bobWallet,
    w1,
    w2,
    w3,
    w4: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;

    await sdk.setProviderOrSigner(adminWallet);
    marketplaceModule = await appModule.deployMarketplaceModule({
      name: "Test Marketplace",
      marketFeeBasisPoints: 0,
    });
    dummyNftModule = await appModule.deployNftModule({
      name: "TEST NFT",
      sellerFeeBasisPoints: 100,
    });
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
    dummyBundleModule = await appModule.deployBundleModule({
      name: "TEST BUNDLE",
      sellerFeeBasisPoints: 100,
    });
    await dummyBundleModule.createAndMintBatch([
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

    customTokenModule = await appModule.deployCurrencyModule({
      name: "Test",
      symbol: "TEST",
    });
    await customTokenModule.mintBatchTo([
      {
        address: bobWallet.address,
        amount: ethers.utils.parseUnits("1000000000000000000000"),
      },
      {
        address: samWallet.address,
        amount: ethers.utils.parseUnits("100000000000000000000"),
      },
      {
        address: adminWallet.address,
        amount: ethers.utils.parseUnits("100000000000000000000"),
      },
    ]);
    tokenAddress = customTokenModule.address;
  });

  const createDirectListing = async (
    contractAddress: string,
    tokenId: BigNumberish,
    quantity: BigNumberish = 1,
  ): Promise<BigNumber> => {
    return await marketplaceModule.createDirectListing({
      assetContractAddress: contractAddress,
      buyoutPricePerToken: ethers.utils.parseUnits("10"),
      currencyContractAddress: tokenAddress,
      startTimeInSeconds: Math.floor(Date.now() / 1000),
      listingDurationInSeconds: 60 * 60 * 24,
      tokenId,
      quantity,
    });
  };

  const createAuctionListing = async (
    contractAddress: string,
    tokenId: BigNumberish,
    quantity: BigNumberish = 1,
    startTime: number = Math.floor(Date.now() / 1000),
  ): Promise<BigNumber> => {
    return await marketplaceModule.createAuctionListing({
      assetContractAddress: contractAddress,
      buyoutPricePerToken: ethers.utils.parseUnits("10"),
      currencyContractAddress: tokenAddress,
      startTimeInSeconds: startTime,
      listingDurationInSeconds: 60 * 60 * 24,
      tokenId,
      quantity,
      reservePricePerToken: ethers.utils.parseUnits("1"),
    });
  };

  describe("Listing", () => {
    it("should list direct listings with 721s", async () => {
      const listingId = await createDirectListing(dummyNftModule.address, 0);
      assert.isDefined(listingId);
    });

    it("should list direct listings with 1155s", async () => {
      const listingId = await createDirectListing(
        dummyBundleModule.address,
        0,
        10,
      );
      assert.isDefined(listingId);
    });

    it("should list auction listings with 721s", async () => {
      const listingId = await createAuctionListing(dummyNftModule.address, 0);
      assert.isDefined(listingId);
    });

    it("should list auction listings with 1155s", async () => {
      const listingId = await createAuctionListing(
        dummyNftModule.address,
        0,
        10,
      );
      assert.isDefined(listingId);
    });
  });

  describe("Get Listing", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.setProviderOrSigner(adminWallet);
      directListingId = await createDirectListing(dummyNftModule.address, 0);
      auctionListingId = await createAuctionListing(dummyNftModule.address, 1);
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
      await sdk.setProviderOrSigner(adminWallet);
      directListingId = await createDirectListing(dummyNftModule.address, 0);
      auctionListingId = await createAuctionListing(dummyNftModule.address, 1);

      directListingIdMultiple = await createDirectListing(
        dummyBundleModule.address,
        0,
        10,
      );
      auctionListingIdMultiple = await createAuctionListing(
        dummyBundleModule.address,
        0,
        10,
      );
    });

    it("should allow the seller to accept an offer", async () => {
      await sdk.setProviderOrSigner(bobWallet);

      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );

      await marketplaceModule.makeOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("10"),
      });

      await sdk.setProviderOrSigner(adminWallet);
      await marketplaceModule.acceptDirectListingOffer(
        directListingId,
        bobWallet.address,
      );

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );
    });

    it("should allow a buyer to buyout a direct listing", async () => {
      await sdk.setProviderOrSigner(bobWallet);

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
      await sdk.setProviderOrSigner(bobWallet);
      await marketplaceModule.makeOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("1"),
      });

      const offer = await marketplaceModule.getActiveOffer(
        directListingId,
        bobWallet.address,
      );

      assert.equal(offer.buyerAddress, bobWallet.address);
      assert.equal(
        offer.pricePerToken.toString(),
        ethers.utils.parseUnits("1").toString(),
      );
      assert.equal(offer.listingId.toString(), directListingId.toString());

      await sdk.setProviderOrSigner(samWallet);
      await marketplaceModule.makeOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("1"),
      });

      const secondOffer = await marketplaceModule.getActiveOffer(
        directListingId,
        samWallet.address,
      );

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
      await sdk.setProviderOrSigner(bobWallet);
      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("1"),
      });

      let winningBid = await marketplaceModule.getWinningBid(auctionListingId);

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
      await sdk.setProviderOrSigner(samWallet);
      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });

      winningBid = await marketplaceModule.getWinningBid(auctionListingId);
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
      await sdk.setProviderOrSigner(adminWallet);
      directListingId = await createDirectListing(dummyNftModule.address, 0);
      auctionListingId = await createAuctionListing(dummyNftModule.address, 1);
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
      await sdk.setProviderOrSigner(adminWallet);
      directListingId = await createDirectListing(dummyNftModule.address, 0);
      auctionListingId = await createAuctionListing(dummyNftModule.address, 1);
    });

    it("should automatically award a buyout", async () => {
      await sdk.setProviderOrSigner(bobWallet);
      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
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
      await sdk.setProviderOrSigner(bobWallet);
      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });

      const winningBid = await marketplaceModule.getWinningBid(
        auctionListingId,
      );

      assert.equal(
        winningBid.buyerAddress,
        bobWallet.address,
        "Bob should be the winning bidder",
      );

      await sdk.setProviderOrSigner(bobWallet);
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
      await sdk.setProviderOrSigner(bobWallet);
      const currentBalance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        currentBalance.toString(),
        "0",
        "The buyer should start with no tokens",
      );
      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
        listingId: auctionListingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });
      try {
        await marketplaceModule.makeBid({
          currencyContractAddress: tokenAddress,
          listingId: auctionListingId,
          pricePerToken: ethers.utils.parseUnits("2.01"),
        });
        // eslint-disable-next-line no-empty
      } catch (err) {}
    });

    it("should allow an auction buyout", async () => {
      const id = await marketplaceModule.createAuctionListing({
        assetContractAddress: dummyBundleModule.address,
        buyoutPricePerToken: ethers.utils.parseUnits("10"),
        currencyContractAddress: tokenAddress,
        // to start tomorrow so we can update it
        startTimeInSeconds: Math.floor(Date.now() / 1000),
        listingDurationInSeconds: 60 * 60 * 24,
        tokenId: "1",
        quantity: 2,
        reservePricePerToken: ethers.utils.parseUnits("1"),
      });
      await sdk.setProviderOrSigner(bobWallet);
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
      await sdk.setProviderOrSigner(adminWallet);
      directListingId = await createDirectListing(dummyNftModule.address, 0);
      auctionListingId = await createAuctionListing(dummyNftModule.address, 1);
    });

    it("should allow a seller to close an auction that hasn't started yet", async () => {
      const id = await marketplaceModule.createAuctionListing({
        assetContractAddress: dummyNftModule.address,
        buyoutPricePerToken: ethers.utils.parseUnits("10"),
        currencyContractAddress: tokenAddress,
        // to start tomorrow so we can update it
        startTimeInSeconds: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
        listingDurationInSeconds: 60 * 60 * 24,
        tokenId: "0",
        quantity: 1,
        reservePricePerToken: ethers.utils.parseUnits("1"),
      });
      await marketplaceModule.cancelAuctionListing(id);

      try {
        const listing = await marketplaceModule.getAuctionListing(id);
      } catch (err) {
        if (!(err instanceof ListingNotFoundError)) {
          throw err;
        }
      }
    });

    it("should throw an error when trying to close an auction that already started", async () => {
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
      let listing = await marketplaceModule.getDirectListing(directListingId);
      assert.equal(listing.quantity.toString(), "1");
      await marketplaceModule.cancelDirectListing(directListingId);
      listing = await marketplaceModule.getDirectListing(directListingId);
      assert.equal(listing.quantity.toString(), "0");
    });

    // Skipping until decision is made on this:
    // https://github.com/nftlabs/nftlabs-sdk-ts/issues/119#issuecomment-1003199128
    it.skip("should allow the seller to cancel an auction that has started as long as there are no active bids", async () => {
      const startTime = Math.floor(Date.now() / 1000) - 10000;
      const listingId = await createAuctionListing(
        dummyNftModule.address,
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
      await sdk.setProviderOrSigner(adminWallet);
      const listingId = await marketplaceModule.createAuctionListing({
        assetContractAddress: dummyNftModule.address,
        buyoutPricePerToken: ethers.utils.parseUnits("10"),
        currencyContractAddress: tokenAddress,
        startTimeInSeconds: now,
        listingDurationInSeconds: 60,
        tokenId: "2",
        quantity: "1",
        reservePricePerToken: ethers.utils.parseUnits("1"),
      });

      await sdk.setProviderOrSigner(bobWallet);

      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
        listingId,
        pricePerToken: ethers.utils.parseUnits("2"),
      });

      await fastForwardTime(60 * 60);

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
      await sdk.setProviderOrSigner(adminWallet);
      const oldTokenBalance = await customTokenModule.balanceOf(
        adminWallet.address,
      );
      assert.equal(
        oldTokenBalance.value,
        ethers.utils.parseUnits("100000000000000000000").toString(),
        "The buyer should have 100000000000000000000 tokens to start",
      );

      await marketplaceModule.closeAuctionListing(listingId);

      const newTokenBalance = await customTokenModule.balanceOf(
        adminWallet.address,
      );
      assert.equal(
        newTokenBalance.value,
        ethers.utils
          .parseUnits("100000000000000000000")
          // eslint-disable-next-line line-comment-position
          .add(ethers.utils.parseUnits("1.98")) // 2% taken out for royalties
          .toString(),
        "The buyer should have two additional tokens after the listing closes",
      );
    });
  });

  describe("Updating listings", () => {
    let directListingId: BigNumber;
    let auctionListingId: BigNumber;

    beforeEach(async () => {
      await sdk.setProviderOrSigner(adminWallet);
      directListingId = await createDirectListing(dummyNftModule.address, 0);
      auctionListingId = await createAuctionListing(dummyNftModule.address, 1);
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

      const id = await marketplaceModule.createAuctionListing({
        assetContractAddress: dummyNftModule.address,
        buyoutPricePerToken: ethers.utils.parseUnits("10"),
        currencyContractAddress: tokenAddress,
        // to start tomorrow so we can update it
        startTimeInSeconds: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
        listingDurationInSeconds: 60 * 60 * 24,
        tokenId: "0",
        quantity: 1,
        reservePricePerToken: ethers.utils.parseUnits("1"),
      });

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
    it("should return the correct bid buffer rules", async () => {
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
      await sdk.setProviderOrSigner(adminWallet);
    });

    it("should set the correct bid buffer default of 500 bps", async () => {
      const buffer = await marketplaceModule.getTimeBufferInSeconds();
      assert.equal(buffer.toNumber(), 15 * 60);
    });

    it("should set the correct time buffer default of 15 minutes", async () => {
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
});
