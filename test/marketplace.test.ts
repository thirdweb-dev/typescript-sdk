import { NATIVE_TOKEN_ADDRESS } from "./../src/common/currency";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { MarketplaceModule, NFTModule, BundleModule } from "../src/modules";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

describe("Marketplace Module", async () => {
  let marketplaceModule: MarketplaceModule;
  let dummyNftModule: NFTModule;
  let dummyBundleModule: BundleModule;

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
    console.log("Creating drop module");
    await sdk.setProviderOrSigner(adminWallet);

    marketplaceModule = await appModule.deployMarketplaceModule({
      name: "Test Marketplace",
      marketFeeBasisPoints: 100,
    });
    console.log(
      "Created marketplace module at address: ",
      marketplaceModule.address,
    );

    dummyNftModule = await appModule.deployNftModule({
      name: "TEST NFT",
      sellerFeeBasisPoints: 100,
    });
    console.log("Created nft module at address: ", dummyNftModule.address);

    await dummyNftModule.mint({
      name: "Test 0",
    });

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
  });

  describe("Listing", async () => {
    it("should list direct listings with 721s", async () => {
      const listingId = await marketplaceModule.createDirectListing({
        assetContractAddress: dummyNftModule.address,
        buyoutPrice: ethers.utils.parseUnits("1"),
        currencyContractAddress: NATIVE_TOKEN_ADDRESS,
        quantity: 1,
        startTimeInSeconds: Math.floor(Date.now() / 1000),
        tokenId: sample721Id,
        listingDurationInSeconds: 60,
      });
      assert.isDefined(listingId);
    });

    it("should list direct listings with 1155s", async () => {
      const listingId = await marketplaceModule.createDirectListing({
        assetContractAddress: dummyBundleModule.address,
        buyoutPrice: ethers.utils.parseUnits("1"),
        currencyContractAddress: NATIVE_TOKEN_ADDRESS,
        quantity: 10,
        startTimeInSeconds: Math.floor(Date.now() / 1000),
        tokenId: sample1155Id,
        listingDurationInSeconds: 60,
      });

      assert.isDefined(listingId);
    });
  });
});
