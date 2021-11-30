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
    factory
      .useNativeCurrency()
      .setPrice(BigNumber.from("100000000000000000000"));

    await dropModule.setMintConditions(factory);
  });
});
