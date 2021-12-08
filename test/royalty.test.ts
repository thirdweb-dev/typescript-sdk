import * as chai from "chai";
import { ThirdwebSDK } from "../src/index";
import { SplitsModule } from "../src/modules/royalty";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

const testTokenAddress = "0xf18feb8b2f58691d67c98db98b360840df340e74";
const testSplitModule = "0xe13B1c6856c85aD3bEA8DCf2c41620D4aBe3Daa0";
const thirdwebRoyaltyAddress = "0xE00994EBDB59f70350E2cdeb897796F732331562";

describe("Splits Module", async () => {
  let sdk: ThirdwebSDK;
  let royaltyModule: SplitsModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(RPC_URL, {
      ipfsGatewayUrl: "https://ipfs.io/ipfs/",
    });
    royaltyModule = sdk.getSplitsModule(testSplitModule);
  });

  it.skip("distributing funds should work", async () => {
    await royaltyModule.distributeToken(testTokenAddress);
    console.log("DISTRIBUTED");
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

  it.skip("should return the correct balance", async () => {
    const recipients = await royaltyModule.getAllRecipients();
    for (const r of recipients) {
      console.log(
        "Balance for",
        r.address,
        (await royaltyModule.balanceOfToken(r.address, testTokenAddress))
          .displayValue,
      );
    }
    return Promise.resolve();
  });

  it.skip("should allow withdrawals", async () => {
    await royaltyModule.withdrawToken(thirdwebRoyaltyAddress, testTokenAddress);
  });
});
