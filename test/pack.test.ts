import { BigNumberish, ethers } from "ethers";
import { PackModule, ThirdwebSDK } from "../src/index";
import * as chai from "chai";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Pack Module", async () => {
  let sdk: ThirdwebSDK;
  let packModule: PackModule;

  beforeEach(async () => {
    if (process.env.PKEY) {
      sdk = new ThirdwebSDK(
        new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
      );
    } else {
      sdk = new ThirdwebSDK(RPC_URL);
    }

    packModule = sdk.getPackModule(
      "0x62B11c3E9234DB862d63389B3Aa9e4fc858d502c",
    );
  });

  it("should return the correct royalty recipient", async () => {
    const recipient = await packModule.getRoyaltyRecipientAddress();
    chai.assert.equal(
      "0xA47220197e8c7F7ec462989Ca992b706747B77A8",
      recipient,
      "The default royalty recipient should be the project address",
    );
  });

  it("should return the correct royalty BPS", async () => {
    const bps = await packModule.getRoyaltyBps();
    chai.assert.equal(
      "1000",
      bps.toString(),
      "The royalty BPS should be 10000 (10%)",
    );
  });
});
