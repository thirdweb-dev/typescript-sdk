import { AddressZero } from "@ethersproject/constants";
import * as chai from "chai";
import { NFTModule, ThirdwebSDK } from "../src/index";
import { ethers } from "ethers";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  let sdk: ThirdwebSDK;
  let nftModule: NFTModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(
        process.env.PKEY,
        ethers.getDefaultProvider("https://rpc-mumbai.maticvigil.com")
        )
    );

    /**
     * This contract address *should* exist forever on testnet
     * so we can use it to test that the NFT module works
     * as expected.
     *
     * This contract includes burned NFTs which can be useful
     * for testing.
     */

    nftModule = sdk.getNFTModule("0x364A9b8f4382bB583C3833E484A44f7A189312a7");
  });

  it("should return nfts even if some are burned", async () => {
    try {
      const nfts = await nftModule.getAllWithOwner();
      chai.assert.isArray(nfts);
    } catch (err) {
      chai.assert.fail(err);
    }
  });

  it("should return an owner as zero address for an nft that is burned", async () => {
    /**
     * The token with id 1 has been burned and can never be recovered,
     * so it serves as a good test case.
     */
    try {
      const nft = await nftModule.getWithOwner("0");
      chai.assert.equal(nft.owner, AddressZero);
    } catch (err) {

      chai.assert.fail(err);
    }
  });

  it("the metadata was not changed", async () => {
    /**
     * The token with id 1 has been burned and can never be recovered,
     * so it serves as a good test case.
     */
    try {
      const testBPS = Math.floor(Math.random() * 10) * 100;
      await nftModule.setRoyaltyBps(testBPS);
      //throw new Error("should not reach here");
      //throw new Error(JSON.stringify(await nftModule.getMetadata()));
      chai.assert.equal(testBPS, (await nftModule.getMetadata()).metadata.seller_fee_basis_points);
    } catch (err) {
      chai.assert.fail(err);
    }
  });

});
