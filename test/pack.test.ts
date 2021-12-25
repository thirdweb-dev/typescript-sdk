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
          name: `NFT ${i}`,
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
          amount: 50,
        },
        {
          tokenId: "1",
          amount: 50,
        },
        {
          tokenId: "2",
          amount: 50,
        },
      ],
      metadata: {
        name: "Pack",
      },
    });
    return pack;
  };

  describe("Pack Creation", () => {
    beforeEach(async () => {
      await createBundles();
    });

    it("should allow you to create a batch of packs", async () => {
      const pack = await createPacks();

      assert.equal(pack.creator, adminWallet.address);
      assert.equal(pack.id.toString(), "0");
      assert.equal(pack.metadata.name, "Test Pack");
    });

    it("should return the correct rewards", async () => {
      const pack = await createPacks();
      const rewards = await packModule.getNFTs(pack.id);

      const first = rewards.find(
        (reward) =>
          reward.metadata.id === "0" &&
          reward.supply.toNumber() === 50 &&
          reward.metadata.name === "NFT 1",
      );

      const second = rewards.find(
        (reward) =>
          reward.metadata.id === "1" &&
          reward.supply.toNumber() === 50 &&
          reward.metadata.name === "NFT 2",
      );

      const third = rewards.find(
        (reward) =>
          reward.metadata.id === "2" &&
          reward.supply.toNumber() === 50 &&
          reward.metadata.name === "NFT 3",
      );

      assert.isDefined(first, "First NFT not found");
      assert.isDefined(second, "Second NFT not found");
      assert.isDefined(third, "Third NFT not found");
    });

    it("should return correct pack supply", async () => {
      const pack = await createPacks();
      assert.equal("150", pack.currentSupply.toString());
    });
  });
});
