import { INFTBundleCreateArgs } from "../src/modules/bundle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BundleModule, PackMetadata, PackModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

import { assert, expect } from "chai";

global.fetch = require("node-fetch");

// TODO: Write some actual pack module tests
describe("Pack Module", async () => {
  let packModule: PackModule;
  let bundleModule: BundleModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
    packModule = await appModule.deployPackModule({
      name: "Pack Module",
      sellerFeeBasisPoints: 1000,
      feeRecipient: samWallet.address,
    });

    bundleModule = await appModule.deployBundleModule({
      name: "NFT Module",
      sellerFeeBasisPoints: 1000,
    });
  });

  const createBundles = async () => {
    const batch: INFTBundleCreateArgs[] = [];
    for (let i = 0; i < 5; i++) {
      batch.push({
        metadata: {
          name: `Test ${i}`,
        },
        supply: 1000,
      });
    }

    await bundleModule.createAndMintBatch(batch);
  };

  const createPacks = async (): Promise<PackMetadata> => {
    const pack = await packModule.create({
      assetContract: bundleModule.address,
      assets: [
        {
          tokenId: "0",
          amount: 10,
        },
        {
          tokenId: "1",
          amount: 20,
        },
      ],
      metadata: {
        name: "Test Pack",
      },
    });
    return pack;
  };

  describe("Buying Packs", () => {
    beforeEach(async () => {
      await createBundles();
    });

    it("should allow you to open a pack", async () => {
      const pack = await createPacks();

      const opened = await packModule.open("0");
      console.log(opened);
    });
  });

  describe("Creating Packs", () => {
    beforeEach(async () => {
      await createBundles();
    });

    it("should allow you to create a batch of packs", async () => {
      console.log("Creating packs");
      const pack = await createPacks();

      assert.equal(pack.creator, adminWallet.address);
      assert.equal(pack.id.toString(), "0");
      assert.equal(pack.metadata.name, "Test Pack");
    });

    it("should return the correct rewards", async () => {
      const pack = await createPacks();

      const rewards = await packModule.getNFTs(pack.id);

      const foundFirst = rewards.find(
        (r) =>
          r.metadata.id === "0" &&
          r.supply.toNumber() === 10 &&
          r.metadata.name === "Test 0",
      );
      assert.isTrue(foundFirst !== undefined, "First NFT not found");

      const foundSecond = rewards.find(
        (r) =>
          r.metadata.id === "1" &&
          r.supply.toNumber() === 20 &&
          r.metadata.name === "Test 1",
      );
      assert.isTrue(foundSecond !== undefined, "Second NFT not found");
    });
  });
});
