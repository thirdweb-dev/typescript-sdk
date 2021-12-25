import { NATIVE_TOKEN_ADDRESS } from "../src/common/currency";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  MarketplaceModule,
  NFTModule,
  BundleModule,
  TokenModule,
} from "../src/modules";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert, should } from "chai";

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
      marketFeeBasisPoints: 100,
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
  ): Promise<BigNumber> => {
    return await marketplaceModule.createAuctionListing({
      assetContractAddress: contractAddress,
      buyoutPricePerToken: ethers.utils.parseUnits("10"),
      currencyContractAddress: tokenAddress,
      startTimeInSeconds: Math.floor(Date.now() / 1000),
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
        quantityDesired: 1,
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
        quantityDesired: 1,
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
      } catch (err) {
        expect(err).to.have.property(
          "message",
          `Listing ${auctionListingId.toString()} is not a direct listing`,
          "",
        );
      }

      try {
        await marketplaceModule.getAuctionListing(directListingId);
      } catch (err) {
        expect(err).to.have.property(
          "message",
          `Listing ${directListingId.toString()} is not an auction listing`,
          "",
        );
      }
    });
  });

  describe("Winning Bids", () => {
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
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("20"),
      });

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );
    });

    it("should allow the seller to accept the winning bid", async () => {
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
        quantityDesired: 1,
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

      await sdk.setProviderOrSigner(adminWallet);
      await marketplaceModule.acceptWinningBid(auctionListingId);

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
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

    it("should allow a seller to close an auction", async () => {
      await marketplaceModule.removeListing(auctionListingId);

      const listing = await marketplaceModule.getAuctionListing(
        auctionListingId,
      );
    });

    it("should allow the seller to accept the winning bid", async () => {
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
        quantityDesired: 1,
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

      await sdk.setProviderOrSigner(adminWallet);
      await marketplaceModule.acceptWinningBid(auctionListingId);

      const balance = await dummyNftModule.balanceOf(bobWallet.address);
      assert.equal(
        balance.toString(),
        "1",
        "The buyer should have been awarded token",
      );
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
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("2"),
      });
      try {
        await marketplaceModule.makeBid({
          currencyContractAddress: tokenAddress,
          listingId: auctionListingId,
          quantityDesired: 1,
          pricePerToken: ethers.utils.parseUnits("2.01"),
        });
      } catch (err) {
        console.error("error", err);
      }
    });
  });
});
