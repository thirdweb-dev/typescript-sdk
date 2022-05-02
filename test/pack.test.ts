import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { sdk, signers } from "./before-setup";

import { assert } from "chai";
import { BigNumber } from "ethers";
import { EditionMetadataInput, Pack, Edition } from "../src";
import { PackMetadata } from "../src/types/packs";

global.fetch = require("node-fetch");

// TODO: Write some actual pack contract tests
describe("Pack Contract", async () => {
  let packContract: Pack;
  let bundleContract: Edition;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    packContract = sdk.getPack(
      await sdk.deployer.deployBuiltInContract(Pack.contractType, {
        name: "Pack Contract",
        seller_fee_basis_points: 1000,
      }),
    );

    bundleContract = sdk.getEdition(
      await sdk.deployer.deployBuiltInContract(Edition.contractType, {
        name: "NFT Contract",
        seller_fee_basis_points: 1000,
        primary_sale_recipient: adminWallet.address,
      }),
    );
  });

  const createBundles = async () => {
    const batch: EditionMetadataInput[] = [];
    for (let i = 0; i < 5; i++) {
      batch.push({
        metadata: {
          name: `NFT ${i}`,
        },
        supply: BigNumber.from(1000),
      });
    }

    await bundleContract.mintBatch(batch);
  };

  const createPacks = async (): Promise<PackMetadata[]> => {
    const packOne = await packContract.create({
      assetContract: bundleContract.getAddress(),
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

    const packTwo = await packContract.create({
      assetContract: bundleContract.getAddress(),
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
      const rewards = await packContract.getNFTs(pack.id);

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
      const balanceOne = await packContract.balance(packOne.id);
      const balanceTwo = await packContract.balance(packTwo.id);

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
      const result = await packContract.open(pack[0].id);
      assert.equal(result.length, 1);
    });
  });

  describe("Get owned packs", async () => {
    beforeEach(async () => {
      await createBundles();
    });

    it("get owned returns pack metadata and balances", async () => {
      const pack = await createPacks();

      let adminOwned = await packContract.getOwned();
      assert.equal(adminOwned.length, 2);
      assert.equal(adminOwned[0].ownedByAddress.toString(), "150");
      assert.equal(adminOwned[1].ownedByAddress.toString(), "75");

      await packContract.transfer(samWallet.address, "0", BigNumber.from(50));
      const samOwned = await packContract.getOwned(samWallet.address);
      assert.equal(samOwned.length, 1);
      assert.equal(samOwned[0].ownedByAddress.toString(), "50");

      adminOwned = await packContract.getOwned();
      assert.equal(adminOwned[0].ownedByAddress.toString(), "100");
    });
  });
});
