import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Edition } from "../src/index";
import { expectError, sdk, signers, storage } from "./before-setup";

import { assert, expect } from "chai";
import { AddressZero } from "@ethersproject/constants";
import { ethers } from "ethers";

global.fetch = require("cross-fetch");

describe("Edition Contract", async () => {
  let editionContract: Edition;
  // let nftContract: NFTContract;
  // let currencyContract: CurrencyContract;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.wallet.connect(adminWallet);
    const address = await sdk.deployer.deployEdition({
      name: `Testing bundle from SDK`,
      description: "Test contract from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      primary_sale_recipient: adminWallet.address,
      seller_fee_basis_points: 1000,
      fee_recipient: AddressZero,
      platform_fee_basis_points: 10,
      platform_fee_recipient: AddressZero,
    });
    editionContract = await sdk.getEdition(address);
  });

  it("gas cost", async () => {
    const cost = await editionContract.estimator.gasCostOf("mintTo", [
      adminWallet.address,
      ethers.constants.MaxUint256,
      "mock://12398172398172389/0",
      1,
    ]);
    expect(parseFloat(cost)).gt(0);
  });

  it("should respect pagination", async () => {
    const nfts = [];
    for (let i = 0; i < 100; i++) {
      nfts.push({
        metadata: { name: `Test${i}` },
        supply: 10,
      });
    }
    await editionContract.mintBatch(nfts);
    const total = await editionContract.getTotalCount();
    expect(total.toNumber()).to.eq(100);
    const page1 = await editionContract.getAll({
      count: 2,
      start: 0,
    });
    expect(page1).to.be.an("array").length(2);
    const page2 = await editionContract.getAll({
      count: 2,
      start: 20,
    });
    expect(page2).to.be.an("array").length(2);
    expect(page2[0].metadata.name).to.eq("Test20");
    expect(page2[1].metadata.name).to.eq("Test21");
  });

  it("mint additional suply", async () => {
    const tx = await editionContract.mintToSelf({
      metadata: {
        name: "Bundle 1",
        description: "Bundle 1",
        image: "fake://myownfakeipfs",
      },
      supply: 10,
    });
    const nft = await editionContract.get(tx.id);
    expect(nft.supply.toNumber()).to.eq(10);
    await editionContract.mintAdditionalSupply(tx.id, 10);
    const nft2 = await editionContract.get(tx.id);
    expect(nft2.supply.toNumber()).to.eq(20);
  });

  it("should mint with URI", async () => {
    const uri = await storage.uploadMetadata({
      name: "Test1",
    });
    const tx = await editionContract.mintToSelf({
      metadata: uri,
      supply: 10,
    });
    const nft = await editionContract.get(tx.id);
    assert.isNotNull(nft);
    assert.equal(nft.metadata.name, "Test1");
  });

  it("should mint batch with URI", async () => {
    const uri = await storage.uploadMetadata({
      name: "Test1",
    });
    await editionContract.mintBatch([
      {
        metadata: uri,
        supply: 10,
      },
    ]);
    const nft = await editionContract.get("0");
    assert.isNotNull(nft);
    assert.equal(nft.metadata.name, "Test1");
  });

  it("should return all owned collection tokens", async () => {
    await editionContract.mintToSelf({
      metadata: {
        name: "Bundle 1",
        description: "Bundle 1",
        image: "fake://myownfakeipfs",
      },
      supply: 100,
    });
    const nfts = await editionContract.getOwned(adminWallet.address);
    expect(nfts).to.be.an("array").length(1);
    expect(nfts[0].metadata.image).to.be.equal("fake://myownfakeipfs");
    expect(nfts[0].owner).to.be.equal(adminWallet.address);
    expect(nfts[0].quantityOwned.toNumber()).to.be.equal(100);
    expect(nfts[0].supply.toNumber()).to.be.equal(100);

    const bobsNfts = await editionContract.getOwned(bobWallet.address);
    expect(bobsNfts)
      .to.be.an("array")
      .length(0, "Bob should not have any nfts");

    await editionContract.transfer(bobWallet.address, 0, 20);
    const adminNft = await editionContract.getOwned(adminWallet.address);
    expect(adminNft[0].quantityOwned.toNumber()).to.be.equal(80);
    const bobsNftsAfterTransfer = await editionContract.getOwned(
      bobWallet.address,
    );
    expect(bobsNftsAfterTransfer[0].quantityOwned.toNumber()).to.be.equal(20);
  });

  it("should airdrop edition tokens to different wallets", async () => {
    await editionContract.mintToSelf({
      metadata: {
        name: "Bundle 1",
        description: "Bundle 1",
        image: "fake://myownfakeipfs",
      },
      supply: 8,
    });
    const addresses = [
      {
        address: samWallet.address,
        quantity: 5,
      },
      {
        address: bobWallet.address,
        quantity: 3,
      },
    ];

    await editionContract.airdrop(0, addresses);

    const samOwned = await editionContract.getOwned(samWallet.address);
    const bobOwned = await editionContract.getOwned(bobWallet.address);
    expect(samOwned[0].quantityOwned.toNumber()).to.be.equal(5);
    expect(bobOwned[0].quantityOwned.toNumber()).to.be.equal(3);
  });

  it("should fail airdrop because not enough NFTs owned", async () => {
    await editionContract.mintToSelf({
      metadata: {
        name: "Bundle 1",
        description: "Bundle 1",
        image: "fake://myownfakeipfs",
      },
      supply: 8,
    });
    const addresses = [
      {
        address: samWallet.address,
        quantity: 5,
      },
      {
        address: bobWallet.address,
        quantity: 12,
      },
    ];

    try {
      await editionContract.airdrop(0, addresses);
    } catch (e) {
      expectError(e, "The caller owns");
    }
  });

  // TODO: This test should move to the royalty suite
  it("updates the bps in both the metadata and on-chain", async () => {
    const currentBps = (await editionContract.royalties.getDefaultRoyaltyInfo())
      .seller_fee_basis_points;
    assert.equal(currentBps, 1000);
    const cMetadata = await editionContract.metadata.get();
    assert.equal(cMetadata.seller_fee_basis_points, 1000);

    const testBPS = 100;
    await editionContract.royalties.setDefaultRoyaltyInfo({
      seller_fee_basis_points: testBPS,
    });
    const newMetadata = await editionContract.metadata.get();

    assert.equal(
      newMetadata.seller_fee_basis_points,
      testBPS,
      "Fetching the BPS from the metadata should return 100",
    );
    assert.equal(
      (await editionContract.royalties.getDefaultRoyaltyInfo())
        .seller_fee_basis_points,
      testBPS,
      "Fetching the BPS with the tx should return 100",
    );
  });
  it("should correctly upload nft metadata", async () => {
    await editionContract.mintBatch([
      {
        metadata: {
          name: "Test0",
          image: "ipfs://myownipfs0",
        },
        supply: 5,
      },
      {
        metadata: {
          name: "Test1",
          image: "ipfs://myownipfs1",
        },
        supply: 5,
      },
    ]);
    const nfts = await editionContract.getAll();
    expect(nfts).to.be.an("array").length(2);
    let i = 0;
    nfts.forEach((nft) => {
      expect(nft.metadata.name).to.be.equal(`Test${i}`);
      expect(nft.metadata.image).to.be.equal(`ipfs://myownipfs${i}`);
      i++;
    });
  });
});
