import * as chai from "chai";
import { ethers } from "ethers";
import { BundleModule, NFTModule, ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Bundle Module (aka Collection Module)", async () => {
  let sdk: ThirdwebSDK;
  let collectionModule: BundleModule;
  let bundleModule: BundleModule;
  let nftModule: NFTModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
      {
        ipfsGatewayUrl: "https://ipfs.io/ipfs/",
      },
    );
    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */

    bundleModule = sdk.getBundleModule(
      "0x5CF412451f4Cef34293604048238bd18D2BD1e71",
    );

    /**
     * Testing backwards compatibility
     */
    collectionModule = sdk.getCollectionModule(
      "0x5CF412451f4Cef34293604048238bd18D2BD1e71",
    );

    nftModule = sdk.getNFTModule("0x364A9b8f4382bB583C3833E484A44f7A189312a7");
  });

  it("should return all owned collection tokens", async () => {
    /**
     * This wallet owns only one token in the collection (that contains 6 tokens)
     */
    const nfts = await collectionModule.getOwned(
      "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
    );
    chai.expect(nfts).to.be.an("array").length.greaterThan(1);
  });

  it.skip("should create a new collection using token", async () => {
    try {
      await collectionModule.createWithToken(
        "0xbf422E6296770E8750Ff0Ba221EcD7D3f740EE26",
        1,
        {
          metadata: {},
          supply: 1,
        },
      );
    } catch (err) {
      chai.assert.fail(err);
    }
  });

  it.skip("should create a new collection using NFT", async () => {
    try {
      const tokenId = (await nftModule.mint({})).id;
      const owned = await collectionModule.getOwned(
        "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
      );
      await collectionModule.createWithERC721(
        "0x364A9b8f4382bB583C3833E484A44f7A189312a7",
        tokenId,
        {},
      );
    } catch (err) {
      chai.assert.fail(err);
    }
  });

  it.skip("updates the bps in both the metadata and on-chain", async () => {
    /**
     * Update the bps in the metadata and on-chain
     */
    try {
      const testBPS = 100;
      const module = sdk.getBundleModule(
        "0x54ec360704b2e9E4e6499a732b78094D6d78e37B",
      );
      await module.setRoyaltyBps(testBPS);
      const { metadata } = await module.getMetadata();

      chai.assert.equal(
        metadata.seller_fee_basis_points,
        testBPS,
        "Fetching the BPS from the metadata should return 100",
      );
      chai.assert.equal(
        await module.getRoyaltyBps(),
        testBPS,
        "Fetching the BPS with the tx should return 100",
      );
    } catch (err) {
      chai.assert.fail(err);
    }
  });
});
