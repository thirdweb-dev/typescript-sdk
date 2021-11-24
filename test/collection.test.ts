import { BundleModule, NFTModule, ThirdwebSDK } from "../src/index";
import * as chai from "chai";
import { ethers } from "ethers";
global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Bundle Module (aka Collection Module)", async () => {
  let sdk: ThirdwebSDK;
  let collectionModule: BundleModule;
  let BundleModule: BundleModule;
  let nftModule: NFTModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(
        process.env.PKEY,
        ethers.getDefaultProvider(RPC_URL)
      )
    );
    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */

    BundleModule = sdk.getBundleModule(
      "0xC70b9AfAfD4f336c6404fc16Ea885418D153ADC1",
    )
    /*Testing backwards compatibility*/
    collectionModule = sdk.getCollectionModule(
      "0xC70b9AfAfD4f336c6404fc16Ea885418D153ADC1",
    );

    nftModule = sdk.getNFTModule("0x364A9b8f4382bB583C3833E484A44f7A189312a7")



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
  it("should create a new collection using token", async () => {
    try {
      await collectionModule.createWithToken("0xbf422E6296770E8750Ff0Ba221EcD7D3f740EE26", 1, {
        metadata: {},
        supply: 1,
      });
    } catch (err) {
      chai.assert.fail(err);
    }
  });

  it("should create a new collection using NFT", async () => {
    try {
      const tokenId = (await nftModule.mint({})).id
      const owned = await collectionModule.getOwned("0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803")
      await collectionModule.createWithERC721("0x364A9b8f4382bB583C3833E484A44f7A189312a7", tokenId, {})
    } catch (err) {
      chai.assert.fail(err);
    }
  });
});
