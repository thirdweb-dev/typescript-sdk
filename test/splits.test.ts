import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { sdk, signers } from "./before.test";
import { SplitsModule, TokenErc20Module } from "../src";

global.fetch = require("node-fetch");

describe("Splits Module", async () => {
  let splitsModule: SplitsModule;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress,
    abbyWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet, abbyWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.factory.deploy(SplitsModule.moduleType, {
      name: "Splits Module",
      recipientSplits: [
        {
          address: samWallet.address,
          shares: 1,
        },
        {
          address: bobWallet.address,
          shares: 1,
        },
        {
          address: abbyWallet.address,
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
      3,
      "There should be 3 split recipients on this contract",
    );
  });

  it("should return the correct slip percentage for an address", async () => {
    assert.equal(
      (await splitsModule.getRecipientSplitPercentage(samWallet.address))
        .splitPercentage,
      33.33333,
      "Each wallet should have 1/3rd of the split",
    );
  });

  it("should return all the recipients along with their balances", async () => {
    const balances = await splitsModule.balanceOfAllRecipients();
    assert.equal(
      Object.keys(balances).length,
      3,
      "There should be 3 recipients",
    );
  });

  it("should return all the recipients along with their token balances", async () => {
    const addr = await sdk.factory.deploy(TokenErc20Module.moduleType, {
      name: "Test Token",
      symbol: "TST",
    });
    const balances = await splitsModule.balanceOfTokenAllRecipients(addr);
    assert.equal(
      Object.keys(balances).length,
      3,
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
