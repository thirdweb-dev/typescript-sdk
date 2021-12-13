import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PackModule, BundleDropModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber } from "ethers";

global.fetch = require("node-fetch");

// TODO: Write some actual pack module tests
describe("Bundle Drop Module", async () => {
  let bdModule: BundleDropModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
    bdModule = await appModule.deployBundleDropModule({
      name: "Bunlde Drop Module",
      sellerFeeBasisPoints: 1000,
      primarySaleRecipientAddress: adminWallet.address,
    });
  });

  // TODO: Move to royalty test suite
  it("should allow you to set claim conditions", async () => {
    await bdModule.lazyMintBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);

    const factory = bdModule.getClaimConditionsFactory();

    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });

    await bdModule.setClaimCondition(BigNumber.from("0"), factory);

    const conditions = await bdModule.getAllClaimConditions(0);
    assert.lengthOf(conditions, 1);
  });
});
