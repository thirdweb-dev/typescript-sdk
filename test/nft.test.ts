import * as chai from "chai";
import { ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  it("should return nfts even if some are burned", async () => {
    /**
     * This contract address *should* exist forever on testnet
     * so we can use it to test that the NFT module works
     * as expected.
     *
     * This contract includes burned NFTs which can be useful
     * for testing.
     */
    const sdk = new ThirdwebSDK(
      "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    );

    const nftModule = sdk.getNFTModule(
      "0xf27C2a1c44E6F16Fbcc9FBB582d7799057Dc57a6",
    );

    try {
      const nfts = await nftModule.getAllWithOwner();
      chai.assert.isArray(nfts);
    } catch (err) {
      chai.assert.fail(err);
    }
  });
});
