import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PackModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

// TODO: Write some actual pack module tests
describe("Pack Module", async () => {
  let packModule: PackModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
    packModule = await appModule.deployPackModule({
      name: "Pack Module",
      sellerFeeBasisPoints: 1000,
      feeRecipient: samWallet.address,
    });
  });

  // TODO: Move to royalty test suite
  it("should return the correct royalty recipient", async () => {
    const recipient = await packModule.getRoyaltyRecipientAddress();
    assert.equal(
      recipient,
      samWallet.address,
      "The default royalty recipient should be the project address",
    );
  });

  // TODO: Move to royalty test suite
  it("should return the correct royalty BPS", async () => {
    const bps = await packModule.getRoyaltyBps();
    assert.equal(
      "1000",
      bps.toString(),
      "The royalty BPS should be 10000 (10%)",
    );
  });
});
