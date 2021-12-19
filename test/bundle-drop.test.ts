import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect, use } from "chai";
import { BigNumber } from "ethers";
import { BundleDropModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const deepEqualInAnyOrder = require("deep-equal-in-any-order");

use(deepEqualInAnyOrder);

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
  it.skip("should allow you to set claim conditions", async () => {
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

  it.skip("allow all addresses in the merkle tree to claim", async () => {
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

  it.skip("should return the newly minted tokens", async () => {
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

  it.skip("should allow a default claim condition to be used to claim", async () => {
    await bdModule.lazyMintBatch([
      {
        name: "test 0",
      },
      {
        name: "test 1",
      },
      {
        name: "test 2",
      },
    ]);

    const factory = bdModule.getClaimConditionFactory();
    factory.newClaimPhase({
      startTime: new Date(),
    });
    await bdModule.setClaimCondition("0", factory);
    const token = await bdModule.claim("0", 1);
    console.log(token);
  });

  it.skip("should return addresses of all the claimers", async () => {
    await bdModule.lazyMintBatch([
      {
        name: "test 0",
      },
      {
        name: "test 1",
      },
    ]);

    const factory = bdModule.getClaimConditionFactory();
    factory.newClaimPhase({
      startTime: new Date(),
    });
    await bdModule.setClaimCondition("0", factory);
    await bdModule.setClaimCondition("1", factory);
    await bdModule.claim("0", 1);

    await sdk.setProviderOrSigner(samWallet);
    await bdModule.claim("0", 1);

    const claimers = await bdModule.getAllClaimerAddresses("0");
    expect(claimers).to.deep.equalInAnyOrder([
      samWallet.address,
      adminWallet.address,
    ]);

    await sdk.setProviderOrSigner(w1);
    await bdModule.claim("1", 1);
    await sdk.setProviderOrSigner(w2);
    await bdModule.claim("1", 1);

    const newClaimers = await bdModule.getAllClaimerAddresses("1");
    expect(newClaimers).to.deep.equalInAnyOrder([w1.address, w2.address]);
  });

  it.skip("should return the correct status if a token can be claimed", async () => {
    const factory = bdModule.getClaimConditionFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([w1.address]);
    await bdModule.setClaimCondition("0", factory);

    await sdk.setProviderOrSigner(w1);

    const canClaimW1 = await bdModule.canClaim("0", 1);
    assert.isTrue(canClaimW1, "w1 should be able to claimcan claim");

    await sdk.setProviderOrSigner(w2);
    const canClaimW2 = await bdModule.canClaim("0", 1);
    assert.isFalse(canClaimW2, "w2 should not be able to claimcan claim");
  });

  it("should work when the token has a price", async () => {
    await bdModule.lazyMintBatch([
      {
        name: "test",
        description: "test",
      },
    ]);
    const factory = bdModule.getClaimConditionFactory();
    const phase = factory
      .newClaimPhase({
        startTime: new Date(),
      })
      .setPrice(1);
    await bdModule.setClaimCondition("0", factory);
    console.log(await bdModule.getActiveClaimCondition("0"));
    const token = await bdModule.claim("0", 1);
    console.log(token);
  });
});
