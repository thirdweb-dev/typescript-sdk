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

  let adminWallet,
    samWallet,
    abbyWallet,
    bobWallet,
    w1,
    w2,
    w3,
    w4: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;
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

  it("allow all addresses in the merkle tree to claim", async () => {
    console.log("Claim condition set");
    console.log("Minting 100");
    await bdModule.lazyMintBatch([
      {
        name: "test",
        description: "test",
      },
    ]);

    const factory = bdModule.getClaimConditionFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
      maxQuantity: 1000,
    });
    const testWallets: SignerWithAddress[] = [
      bobWallet,
      samWallet,
      abbyWallet,
      w1,
      w2,
      w3,
      w4,
    ];
    const members = testWallets.map((w) => w.address);
    await phase.setSnapshot(members);

    console.log("Setting claim condition");
    await bdModule.setClaimCondition("0", factory);

    for (const member of testWallets) {
      await sdk.setProviderOrSigner(member);
      await bdModule.claim("0", 1);
      console.log(`Address ${member.address} claimed successfully!`);
    }
  });

  it("should return the newly minted tokens", async () => {
    const tokens = [
      {
        name: "test 0",
      },
      {
        name: "test 1",
      },
      {
        name: "test 2",
      },
      {
        name: "test 3",
      },
      {
        name: "test 4",
      },
    ];
    const result = await bdModule.lazyMintBatch(tokens);
    assert.lengthOf(result, tokens.length);
    for (const token of tokens) {
      const found = result.find((t) => t.metadata.name === token.name);
      assert.isDefined(found);
    }

    const moreTokens = [
      {
        name: "test 5",
      },
      {
        name: "test 6",
      },
    ];
    const moreResult = await bdModule.lazyMintBatch(moreTokens);
    assert.lengthOf(moreResult, moreTokens.length);
    for (const token of moreTokens) {
      const found = moreResult.find((t) => t.metadata.name === token.name);
      assert.isDefined(found);
    }
  });
});
