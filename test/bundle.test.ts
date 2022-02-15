import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFTStackCollection } from "../src/index";
import { sdk, signers } from "./before.test";

import { assert, expect } from "chai";
import { AddressZero } from "@ethersproject/constants";

global.fetch = require("node-fetch");

describe("Bundle Contract (aka Collection Contract)", async () => {
  let bundleContract: NFTStackCollection;
  // let nftContract: NFTContract;
  // let currencyContract: CurrencyContract;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.deployContract(NFTStackCollection.contractType, {
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
    bundleContract = sdk.getNFTStackCollection(address);
  });

  it("should return all owned collection tokens", async () => {
    await bundleContract.mint({
      metadata: {
        name: "Bundle 1",
        description: "Bundle 1",
        image: "fake://myownfakeipfs",
      },
      supply: 100,
    });
    const nfts = await bundleContract.getOwned(adminWallet.address);
    expect(nfts).to.be.an("array").length(1);
    expect(nfts[0].metadata.image).to.be.equal("fake://myownfakeipfs");

    const bobsNfts = await bundleContract.getOwned(bobWallet.address);
    expect(bobsNfts)
      .to.be.an("array")
      .length(0, "Bob should not have any nfts");
  });

  // TODO: This test should move to the royalty suite
  it("updates the bps in both the metadata and on-chain", async () => {
    const currentBps = (await bundleContract.royalty.getRoyaltyInfo())
      .seller_fee_basis_points;
    assert.equal(currentBps, 1000);
    const cMetadata = await bundleContract.metadata.get();
    assert.equal(cMetadata.seller_fee_basis_points, 1000);

    const testBPS = 100;
    await bundleContract.royalty.setRoyaltyInfo({
      seller_fee_basis_points: testBPS,
    });
    const newMetadata = await bundleContract.metadata.get();

    assert.equal(
      newMetadata.seller_fee_basis_points,
      testBPS,
      "Fetching the BPS from the metadata should return 100",
    );
    assert.equal(
      (await bundleContract.royalty.getRoyaltyInfo()).seller_fee_basis_points,
      testBPS,
      "Fetching the BPS with the tx should return 100",
    );
  });
  it("should correctly upload nft metadata", async () => {
    await bundleContract.mintBatch([
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
    const nfts = await bundleContract.getAll();
    expect(nfts).to.be.an("array").length(2);
    let i = 0;
    nfts.forEach((nft) => {
      expect(nft.metadata.name).to.be.equal(`Test${i}`);
      expect(nft.metadata.image).to.be.equal(`ipfs://myownipfs${i}`);
      i++;
    });
  });
});
