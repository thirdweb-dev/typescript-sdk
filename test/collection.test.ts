import { CollectionModule, ThirdwebSDK } from "../src/index";
import * as chai from "chai";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Collection Module", async () => {
  let sdk: ThirdwebSDK;
  let collectionModule: CollectionModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(RPC_URL);

    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */
    collectionModule = sdk.getCollectionModule(
      "0x6Da734b14e4CE604f1e18efb7E7f7ef022e96616",
    );
  });

  it("should return all owned collection tokens", async () => {
    /**
     * This wallet owns only one token in the collection (that contains 6 tokens)
     */
    const nfts = await collectionModule.getOwned(
      "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
    );
    chai.expect(nfts).to.be.an("array").lengthOf(1);
  });
});
