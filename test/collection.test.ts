import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BundleModule, CurrencyModule, NFTModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");

const { expect, assert } = chai;

global.fetch = require("node-fetch");

describe("Bundle Module (aka Collection Module)", async () => {
  let collectionModule: BundleModule;
  let bundleModule: BundleModule;
  let nftModule: NFTModule;
  let currencyModule: CurrencyModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);

    nftModule = await appModule.deployNftModule({
      name: "NFT Module",
      sellerFeeBasisPoints: 1000,
    });
    bundleModule = await appModule.deployBundleModule({
      name: "Bundle Module",
      sellerFeeBasisPoints: 1000,
    });
    currencyModule = await appModule.deployCurrencyModule({
      name: "Currency Module",
      symbol: "TEST",
    });

    /**
     * Testing backwards compatibility
     */
    collectionModule = sdk.getCollectionModule(bundleModule.address);
  });

  it("should return all owned collection tokens", async () => {
    await bundleModule.createAndMint({
      metadata: {
        name: "Bundle 1",
        descrition: "Bundle 1",
      },
      supply: 100,
    });
    const nfts = await bundleModule.getOwned(adminWallet.address);
    chai.expect(nfts).to.be.an("array").length(1);

    const bobsNfts = await bundleModule.getOwned(bobWallet.address);
    chai
      .expect(bobsNfts)
      .to.be.an("array")
      .length(0, "Bob should not have any nfts");
  });

  it("should create a new collection using token", async () => {
    await currencyModule.mint(100);

    try {
      await collectionModule.createWithToken(currencyModule.address, 1, {
        metadata: {
          name: "test",
        },
        supply: 1,
      });
    } catch (err) {
      chai.assert.fail(err);
    }
    const nfts = await bundleModule.getOwned(adminWallet.address);
    chai.expect(nfts).to.be.an("array").length(1);
  });

  it("should create a new collection using NFT", async () => {
    const token = await nftModule.mint({
      name: "test",
    });

    try {
      await collectionModule.createWithERC721(nftModule.address, token.id, {
        name: "TEST NFT",
      });
    } catch (err) {
      chai.assert.fail(err);
    }

    const nfts = await bundleModule.getOwned(adminWallet.address);
    chai.expect(nfts).to.be.an("array").length(1);
  });

  // TODO: This test should move to the royalty suite
  it("updates the bps in both the metadata and on-chain", async () => {
    const currentBps = await bundleModule.getRoyaltyBps();
    assert.equal(currentBps, 1000);
    const { metadata: cMetadata } = await bundleModule.getMetadata();
    assert.equal(cMetadata["seller_fee_basis_points"], 1000);

    const testBPS = 100;
    await bundleModule.setRoyaltyBps(testBPS);
    const { metadata: newMetadata } = await bundleModule.getMetadata();

    assert.equal(
      newMetadata.seller_fee_basis_points,
      testBPS,
      "Fetching the BPS from the metadata should return 100",
    );
    assert.equal(
      await bundleModule.getRoyaltyBps(),
      testBPS,
      "Fetching the BPS with the tx should return 100",
    );
  });
});
