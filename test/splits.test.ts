import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { appModule, sdk, signers } from "./before.test";
import { SplitsModule } from "../src";

global.fetch = require("node-fetch");

// const testTokenAddress = "0xf18feb8b2f58691d67c98db98b360840df340e74";
// const thirdwebRoyaltyAddress = "0xE00994EBDB59f70350E2cdeb897796F732331562";

describe("Splits Module", async () => {
  let splitsModule: SplitsModule;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.factory.deploy(SplitsModule.moduleType, {
      name: "Splits Module",
      recipientSplits: [
        {
          address: bobWallet.address,
          shares: 1,
        },
      ],
    });
    splitsModule = sdk.getSplitsModule(address);
  });

  // TODO: Fix bug in the `getAllRecipients` function
  it("should return all recipients of splits", async () => {
    const recipients = await splitsModule.getAllRecipients();
    assert.lengthOf(
      recipients,
      2,
      "There should be 3 split recipients on this contract",
    );
  });

  it("should return the correct slip percentage for an address", async () => {
    assert.equal(
      (await splitsModule.getRecipientSplitPercentage(adminWallet.address))
        .splitPercentage,
      5,
      "The Thirdweb wallet should have 5% share of all royalties",
    );
  });

  it("should return all the recipients along with their balances", async () => {
    const balances = await splitsModule.balanceOfAllRecipients();
    assert.equal(
      Object.keys(balances).length,
      2,
      "There should be 3 recipients",
    );
  });

  it.skip("should return all the recipients along with their token balances", async () => {
    const balances = await splitsModule.balanceOfTokenAllRecipients(
      await appModule
        .deployTokenModule({
          name: "Test Token",
          symbol: "TST",
        })
        .then((tokenModule) => tokenModule.address),
    );
    assert.equal(
      Object.keys(balances).length,
      2,
      "There should be 3 recipients",
    );
  });

  /**
   * TODO: Write the following tests
   *
   * 1. Withdrawing royalties and assuring fund delivery
   * 2. Checking balances
   * 3. Funds are received when a module uses a splits address as a royalty recipient
   */
});
