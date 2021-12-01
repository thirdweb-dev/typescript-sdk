import { BigNumber, ethers } from "ethers";
import { DropModule, ThirdwebSDK } from "../src/index";
global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Drop Module", async () => {
  let sdk: ThirdwebSDK;
  let dropModule: DropModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
    );
    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */
    dropModule = sdk.getDropModule(
      "0x3705506b3ce08b94cf8b1EA41CDe005669B45e37",
    );
  });

  it("should return all owned collection tokens", async () => {
    /**
     * This wallet owns only one token in the collection (that contains 6 tokens)
     */
    const factory = await dropModule.getMintConditionsFactory();
    console.log(factory);
    const allMintConditions = await dropModule.getAllMintConditions();
    console.log("All conditions =", allMintConditions);
  });

  it("should allow you to set a currency and price", async () => {
    const factory = await dropModule.getMintConditionsFactory();

    /**
     *
     * Notes:
     *
     *
     *
     */

    // These conditions will apply on December 1st
    // You need 100 NATIVE tokens to claim a token
    factory
      .newClaimPhase({
        startTime: new Date(Date.parse("01 Dec 2021 00:00:00 GMT")),
      })
      .setPrice(ethers.utils.parseUnits("100", 18));

    // These conditions will apply on December 10th
    // You need 100 ENS tokens to claim a token
    factory
      .newClaimPhase({
        startTime: new Date(Date.parse("10 Dec 2021 00:00:00 GMT")),
      })
      .setPrice(
        ethers.utils.parseUnits("100", 18),
        "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      );

    await dropModule.setMintConditions(factory);
  });
});
