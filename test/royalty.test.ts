import * as chai from "chai";
import { ethers } from "ethers";
import { ThirdwebSDK } from "../src/index";
import { SplitsModule } from "../src/modules/royalty";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

const testTokenAddress = "0xf18feb8b2f58691d67c98db98b360840df340e74";
const testSplitModule = "0xb67223c0518894514D66C9990C3A544eC8BfbA46";
const thirdwebRoyaltyAddress = "0xE00994EBDB59f70350E2cdeb897796F732331562";

describe("Splits Module", async () => {
  let sdk: ThirdwebSDK;
  let royaltyModule: SplitsModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(RPC_URL);

    royaltyModule = sdk.getSplitsModule(testSplitModule);
  });

  it("should return all recipients of splits", async () => {
    const recipients = await royaltyModule.getAllRecipients();
    chai.assert.lengthOf(
      recipients,
      4,
      "There should be 4 split recipients on this contract",
    );
  });

  it("should return the correct slip percentage for an address", async () => {
    chai.assert.equal(
      (await royaltyModule.getRecipientSplitPercentage(thirdwebRoyaltyAddress))
        .splitPercentage,
      5,
      "The Thirdweb wallet should have 5% share of all royalties",
    );
  });

  it("should return the correct balance", async () => {
    const recipients = await royaltyModule.getAllRecipients();
    for (const r of recipients) {
      console.log(
        "Balance for",
        r.address,
        (await royaltyModule.balanceOfByToken(r.address, testTokenAddress))
          .displayValue,
      );
    }
    return Promise.resolve();
  });

  it.skip("should allow withdrawals", async () => {
    await royaltyModule.withdrawToken(thirdwebRoyaltyAddress, testTokenAddress);
  });
});

/**
 * Currency = 0xF18FEb8b2F58691d67C98dB98B360840df340e74
 *
 * Send 0x4d36d531D9cB40b8694763123D52170FAE5e1195
 */
