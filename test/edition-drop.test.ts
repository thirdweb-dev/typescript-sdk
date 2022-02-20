import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect, use } from "chai";
import { BigNumber } from "ethers";
import { EditionDrop, Token } from "../src/index";
import { expectError, sdk, signers } from "./before.test";
import { AddressZero } from "@ethersproject/constants";
import { ClaimEligibility } from "../src/enums";
import { NATIVE_TOKEN_ADDRESS } from "../src/constants/currency";

global.fetch = require("node-fetch");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const deepEqualInAnyOrder = require("deep-equal-in-any-order");

use(deepEqualInAnyOrder);

// TODO: Write some actual pack contract tests
describe("Edition Drop Contract", async () => {
  let bdContract: EditionDrop;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    abbyWallet: SignerWithAddress,
    bobWallet: SignerWithAddress,
    w1: SignerWithAddress,
    w2: SignerWithAddress,
    w3: SignerWithAddress,
    w4: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.deployer.deployContract(
      EditionDrop.contractType,
      {
        name: `Testing bundle drop from SDK`,
        description: "Test contract from tests",
        image:
          "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
        primary_sale_recipient: adminWallet.address,
        seller_fee_basis_points: 500,
        fee_recipient: AddressZero,
        platform_fee_basis_points: 10,
        platform_fee_recipient: AddressZero,
      },
    );
    bdContract = sdk.getEditionDrop(address);
  });

  it("should allow you to set claim conditions", async () => {
    await bdContract.createBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);
    await bdContract.claimConditions.set(BigNumber.from("0"), [{}]);
    const conditions = await bdContract.claimConditions.getAll(0);
    assert.lengthOf(conditions, 1);
  });

  it("allow all addresses in the merkle tree to claim", async () => {
    console.log("Claim condition set");
    console.log("Minting 100");
    await bdContract.createBatch([
      {
        name: "test",
        description: "test",
      },
    ]);

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

    console.log("Setting claim condition");
    await bdContract.claimConditions.set("0", [
      {
        maxQuantity: 1000,
        snapshot: {
          addresses: members,
        },
      },
    ]);

    for (const member of testWallets) {
      await sdk.updateSignerOrProvider(member);
      await bdContract.claim("0", 1);
      console.log(`Address ${member.address} claimed successfully!`);
    }
    const bundle = await bdContract.get("0");
    assert(bundle.supply.toNumber() === testWallets.length);
  });

  it("allow all addresses in the merkle tree to claim using useSnapshot", async () => {
    console.log("Claim condition set");
    console.log("Minting 100");
    await bdContract.createBatch([
      {
        name: "test",
        description: "test",
      },
    ]);

    const testWallets: SignerWithAddress[] = [
      bobWallet,
      samWallet,
      abbyWallet,
      w1,
      w2,
      w3,
    ];
    const members = testWallets.map((w) => w.address);
    console.log("Setting claim condition");
    await bdContract.claimConditions.set("0", [
      {
        maxQuantity: 1000,
        snapshot: {
          addresses: members,
        },
      },
    ]);
    testWallets.push(w4);

    for (const member of testWallets) {
      try {
        sdk.updateSignerOrProvider(member);
        await bdContract.claim("0", 1);
        console.log(`Address ${member.address} claimed successfully!`);
      } catch (e) {
        if (member !== w4) {
          throw e;
        }
        console.log(`Address ${member.address} failed to claim, as expected!`);
      }
    }
    const bundle = await bdContract.get("0");
    assert(bundle.supply.toNumber() === testWallets.length - 1);
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
    const result = await bdContract.createBatch(tokens);
    assert.lengthOf(result, tokens.length);
    for (const token of tokens) {
      const found = result.find(
        async (t) => (await t.data()).name === token.name,
      );
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
    const moreResult = await bdContract.createBatch(moreTokens);
    assert.lengthOf(moreResult, moreTokens.length);
    for (const token of moreTokens) {
      const found = moreResult.find(
        async (t) => (await t.data()).name === token.name,
      );
      assert.isDefined(found);
    }
  });

  it("should allow setting max claims per wallet", async () => {
    await bdContract.createBatch([
      { name: "name", description: "description" },
    ]);
    await bdContract.claimConditions.set(0, [
      {
        snapshot: {
          addresses: [w1.address, w2.address],
          maxClaimablePerAddress: [2, 1],
        },
      },
    ]);
    await sdk.updateSignerOrProvider(w1);
    const tx = await bdContract.claim(0, 2);
    try {
      await sdk.updateSignerOrProvider(w2);
      await bdContract.claim(0, 2);
    } catch (e) {
      expectError(e, "invalid quantity proof");
    }
  });

  it("should allow a default claim condition to be used to claim", async () => {
    await bdContract.createBatch([
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

    await bdContract.claimConditions.set("0", [{}]);
    await bdContract.claim("0", 1);
  });

  it("should return addresses of all the claimers", async () => {
    await bdContract.createBatch([
      {
        name: "test 0",
      },
      {
        name: "test 1",
      },
    ]);

    await bdContract.claimConditions.set("0", [{}]);
    await bdContract.claimConditions.set("1", [{}]);
    await bdContract.claim("0", 1);

    await sdk.updateSignerOrProvider(samWallet);
    await bdContract.claim("0", 1);

    // TODO some asserts
    // const claimers = await bdContract.getAllClaimerAddresses("0");
    // expect(claimers).to.deep.equalInAnyOrder([
    //   samWallet.address,
    //   adminWallet.address,
    // ]);

    await sdk.updateSignerOrProvider(w1);
    await bdContract.claim("1", 1);
    await sdk.updateSignerOrProvider(w2);
    await bdContract.claim("1", 1);

    const ownedW1 = await bdContract.getOwned(w1.address);
    assert(ownedW1.length === 1);
    const ownedW2 = await bdContract.getOwned(w2.address);
    assert(ownedW2.length === 1);
  });

  it("should return the correct status if a token can be claimed", async () => {
    await bdContract.claimConditions.set("0", [
      {
        snapshot: {
          addresses: [w1.address],
        },
      },
    ]);

    await sdk.updateSignerOrProvider(w1);
    console.log(
      await bdContract.claimConditions.getClaimIneligibilityReasons(
        "0",
        1,
        w1.address,
      ),
    );
    const canClaimW1 = await bdContract.claimConditions.canClaim("0", 1);
    assert.isTrue(canClaimW1, "w1 should be able to claim");

    await sdk.updateSignerOrProvider(w2);
    const canClaimW2 = await bdContract.claimConditions.canClaim("0", 1);
    assert.isFalse(canClaimW2, "w2 should not be able to claim");
  });

  it("canClaim: 1 address", async () => {
    await bdContract.claimConditions.set("0", [
      {
        snapshot: {
          addresses: [w1.address],
        },
      },
    ]);

    assert.isTrue(
      await bdContract.claimConditions.canClaim("0", 1, w1.address),
      "can claim",
    );
    assert.isFalse(
      await bdContract.claimConditions.canClaim("0", 1, w2.address),
      "!can claim",
    );
  });

  it("canClaim: 3 address", async () => {
    await bdContract.claimConditions.set("0", [
      {
        snapshot: {
          addresses: [
            w1.address.toUpperCase().replace("0X", "0x"),
            w2.address.toLowerCase(),
            w3.address,
          ],
        },
      },
    ]);

    assert.isTrue(
      await bdContract.claimConditions.canClaim("0", 1, w1.address),
      "can claim",
    );
    assert.isTrue(
      await bdContract.claimConditions.canClaim("0", 1, w2.address),
      "can claim",
    );
    assert.isTrue(
      await bdContract.claimConditions.canClaim("0", 1, w3.address),
      "can claim",
    );
    assert.isFalse(
      await bdContract.claimConditions.canClaim("0", 1, bobWallet.address),
      "!can claim",
    );
  });

  it("should work when the token has a price", async () => {
    await bdContract.createBatch([
      {
        name: "test",
        description: "test",
      },
    ]);
    await bdContract.claimConditions.set("0", [
      {
        price: 1,
      },
    ]);
    await bdContract.claim("0", 1);
  });

  describe("eligibility", () => {
    beforeEach(async () => {
      await bdContract.createBatch([
        {
          name: "test",
          description: "test",
        },
      ]);
    });

    it("should return false if there isn't an active claim condition", async () => {
      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "0",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NoActiveClaimPhase);
      assert.lengthOf(reasons, 1);
      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("set claim condition in the future should not be claimable now", async () => {
      await bdContract.claimConditions.set(0, [
        {
          startTime: new Date(Date.now() + 60 * 60 * 24 * 1000),
        },
      ]);
      const canClaim = await bdContract.claimConditions.canClaim(0, 1);
      expect(canClaim).to.eq(false);
    });

    it("should check for the total supply", async () => {
      await bdContract.claimConditions.set("0", [
        {
          maxQuantity: 1,
        },
      ]);

      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "2",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.NotEnoughSupply);
      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "2",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if an address has valid merkle proofs", async () => {
      await bdContract.claimConditions.set("0", [
        {
          maxQuantity: 1,
          snapshot: { addresses: [w2.address, adminWallet.address] },
        },
      ]);

      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.AddressNotAllowed);
      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if its been long enough since the last claim", async () => {
      await bdContract.claimConditions.set("0", [
        {
          maxQuantity: 10,
          waitInSeconds: 24 * 60 * 60,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);
      await bdContract.claim("0", 1);

      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(
        ClaimEligibility.WaitBeforeNextClaimTransaction,
      );
      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "1",
        bobWallet.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough native currency", async () => {
      await bdContract.claimConditions.set("0", [
        {
          maxQuantity: 10,
          price: "1000000000000000",
          currencyAddress: NATIVE_TOKEN_ADDRESS,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);

      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough erc20 currency", async () => {
      const currency = sdk.getToken(
        await sdk.deployer.deployContract(Token.contractType, {
          name: "test",
          symbol: "test",
        }),
      );

      await bdContract.claimConditions.set("0", [
        {
          maxQuantity: 10,
          price: "1000000000000000",
          currencyAddress: currency.getAddress(),
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);

      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should return nothing if the claim is eligible", async () => {
      await bdContract.claimConditions.set("0", [
        {
          maxQuantity: 10,
          price: "100",
          currencyAddress: NATIVE_TOKEN_ADDRESS,
          snapshot: { addresses: [w1.address, w2.address, w3.address] },
        },
      ]);

      const reasons =
        await bdContract.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          w1.address,
        );
      assert.lengthOf(reasons, 0);

      const canClaim = await bdContract.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isTrue(canClaim);
    });
  });
  it("should allow you to update claim conditions", async () => {
    await bdContract.createBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);

    await bdContract.claimConditions.set(BigNumber.from("0"), [{}]);
    await bdContract.claimConditions.update(BigNumber.from("0"), 0, {});
    const conditions = await bdContract.claimConditions.getAll(0);
    assert.lengthOf(conditions, 1);
  });

  it("should be able to use claim as function expected", async () => {
    await bdContract.createBatch([
      {
        name: "test",
      },
    ]);
    await bdContract.claimConditions.set("0", [{}]);
    await bdContract.claim("0", 1);
    assert((await bdContract.getOwned()).length > 0);
  });

  it("should be able to use claimTo function as expected", async () => {
    await bdContract.createBatch([
      {
        name: "test",
      },
    ]);
    await bdContract.claimConditions.set("0", [{}]);
    await bdContract.claimTo(samWallet.address, "0", 1);
    assert((await bdContract.getOwned(samWallet.address)).length > 0);
  });

  describe("setting merkle claim conditions", () => {
    it("should not overwrite existing merkle keys in the metadata", async () => {
      await bdContract.createBatch([
        { name: "test", description: "test" },
        { name: "test", description: "test" },
      ]);

      await bdContract.claimConditions.set("1", [
        {
          snapshot: { addresses: [w1.address, w2.address, bobWallet.address] },
        },
      ]);

      await bdContract.claimConditions.set("2", [
        {
          snapshot: {
            addresses: [
              w3.address,
              w1.address,
              w2.address,
              adminWallet.address,
            ],
          },
        },
      ]);

      const metadata = await bdContract.metadata.get();
      const merkle: { [key: string]: string } = metadata.merkle;
      assert.lengthOf(Object.keys(merkle), 2);
    });
  });
});
