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

  const sample721Id = "0";
  const sample1155Id = "0";

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
        amount: ethers.utils.parseUnits("10000000"),
      },
      {
        address: samWallet.address,
        amount: ethers.utils.parseUnits("10000000"),
      },
      {
        address: adminWallet.address,
        amount: ethers.utils.parseUnits("10000000"),
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

      await sdk.setProviderOrSigner(bobWallet);
    });

    it("should allow offers to be made on direct listings", async () => {
      console.log(
        "Balance = ",
        await customTokenModule.balanceOf(await sdk.signer.getAddress()),
      );
      await marketplaceModule.makeOffer({
        currencyContractAddress: tokenAddress,
        listingId: directListingId,
        quantityDesired: 1,
        pricePerToken: 1,
      });

      const offers = await marketplaceModule.getActiveOffers(directListingId);
    });

    it("should allow bids to be made on auction listings", async () => {
      console.log(
        "Balance = ",
        await customTokenModule.balanceOf(await sdk.signer.getAddress()),
      );

      await marketplaceModule.makeBid({
        currencyContractAddress: tokenAddress,
        listingId: auctionListingId,
        quantityDesired: 1,
        pricePerToken: ethers.utils.parseUnits("1"),
      });
    });
  });

  describe("Validators", () => {
    it("should throw an error when an auction ID is used in place of a direct listing", async () => {});
  });
});
