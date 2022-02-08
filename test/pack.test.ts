import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { sdk, signers } from "./before.test";

import { assert } from "chai";
import { BigNumber } from "ethers";
import { BundleMetadataInput, PacksModule, TokenErc1155Module } from "../src";
import { PackMetadata } from "../src/types/packs";

global.fetch = require("node-fetch");

// TODO: Write some actual pack module tests
describe("Pack Module", async () => {
  let packModule: PacksModule;
  let bundleModule: TokenErc1155Module;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    packModule = sdk.getPackModule(
      await sdk.factory.deploy(PacksModule.moduleType, {
        name: "Pack Module",
        seller_fee_basis_points: 1000,
      }),
    );

    bundleModule = sdk.getBundleModule(
      await sdk.factory.deploy(TokenErc1155Module.moduleType, {
        name: "NFT Module",
        seller_fee_basis_points: 1000,
      }),
    );
  });

  const createBundles = async () => {
    const batch: BundleMetadataInput[] = [];
    for (let i = 0; i < 5; i++) {
      batch.push({
        metadata: {
          name: `NFT ${i}`,
        },
        supply: BigNumber.from(1000),
      });
    }

    await bundleModule.mintBatch(batch);
  };

  const createPacks = async (): Promise<PackMetadata[]> => {
    const packOne = await packModule.create({
      assetContract: bundleModule.getAddress(),
      assets: [
        {
          tokenId: "0",
          amount: BigNumber.from(50),
        },
        {
          tokenId: "1",
          amount: BigNumber.from(50),
        },
        {
          tokenId: "2",
          amount: BigNumber.from(50),
        },
      ],
      metadata: {
        name: "Pack",
      },
    });

    const packTwo = await packModule.create({
      assetContract: bundleModule.getAddress(),
      assets: [
        {
          tokenId: "0",
          amount: BigNumber.from(50),
        },
        {
          tokenId: "1",
          amount: BigNumber.from(50),
        },
        {
          tokenId: "2",
          amount: BigNumber.from(50),
        },
      ],
      metadata: {
        name: "Pack",
      },
      rewardsPerOpen: BigNumber.from(2),
    });

    return [await packOne.data(), await packTwo.data()];
  };

  describe("Pack Creation", () => {
    beforeEach(async () => {
      await createBundles();
    });

    it("should allow you to create a batch of packs", async () => {
      const [pack] = await createPacks();

      assert.equal(pack.creator, adminWallet.address);
      assert.equal(pack.id.toString(), "0");
      assert.equal(pack.metadata.name, "Pack");
    });

    it("should return the correct rewards", async () => {
      const [pack] = await createPacks();
      const rewards = await packModule.getNFTs(pack.id);

      const first = rewards.find(
        (reward) =>
          reward.metadata.id.toString() === "0" &&
          reward.supply.toNumber() === 50 &&
          reward.metadata.name === "NFT 0",
      );

      const second = rewards.find(
        (reward) =>
          reward.metadata.id.toString() === "1" &&
          reward.supply.toNumber() === 50 &&
          reward.metadata.name === "NFT 1",
      );

      const third = rewards.find(
        (reward) =>
          reward.metadata.id.toString() === "2" &&
          reward.supply.toNumber() === 50 &&
          reward.metadata.name === "NFT 2",
      );

      assert.isDefined(first, "First NFT not found");
      assert.isDefined(second, "Second NFT not found");
      assert.isDefined(third, "Third NFT not found");
    });

    it("should return correct pack supply", async () => {
      const [packOne, packTwo] = await createPacks();
      const balanceOne = await packModule.balance(packOne.id);
      const balanceTwo = await packModule.balance(packTwo.id);

      assert.equal("150", packOne.currentSupply.toString());
      assert.equal("150", balanceOne.toString());
      assert.equal("75", packTwo.currentSupply.toString());
      assert.equal("75", balanceTwo.toString());
    });
  });

  describe("Open Pack", async () => {
    beforeEach(async () => {
      await createBundles();
    });

    it.skip("pack open returns valid reward", async () => {
      const pack = await createPacks();
      // TODO how can we test this with VRF in the way?
      const result = await packModule.open(pack[0].id);
      assert.equal(result.length, 1);
    });
  });

  describe("Get owned packs", async () => {
    beforeEach(async () => {
      await createBundles();
    });

    it("get owned returns pack metadata and balances", async () => {
      const pack = await createPacks();

      let adminOwned = await packModule.getOwned();
      assert.equal(adminOwned.length, 2);
      assert.equal(adminOwned[0].ownedByAddress.toString(), "150");
      assert.equal(adminOwned[1].ownedByAddress.toString(), "75");

      await packModule.transfer(samWallet.address, "0", BigNumber.from(50));
      const samOwned = await packModule.getOwned(samWallet.address);
      assert.equal(samOwned.length, 1);
      assert.equal(samOwned[0].ownedByAddress.toString(), "50");

      adminOwned = await packModule.getOwned();
      assert.equal(adminOwned[0].ownedByAddress.toString(), "100");
    });
  });
});
