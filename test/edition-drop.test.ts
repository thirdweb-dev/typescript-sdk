import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect, use } from "chai";
import { BigNumber } from "ethers";
import { EditionDrop, Token } from "../src/index";
import { expectError, sdk, signers } from "./before-setup";
import { AddressZero } from "@ethersproject/constants";
import { ClaimEligibility } from "../src/enums";
import { NATIVE_TOKEN_ADDRESS } from "../src/constants/currency";
import invariant from "tiny-invariant";

global.fetch = require("cross-fetch");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const deepEqualInAnyOrder = require("deep-equal-in-any-order");

use(deepEqualInAnyOrder);

describe("Edition Drop Contract", async () => {
  let editionDrop: EditionDrop;
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
    sdk.wallet.connect(adminWallet);
    const address = await sdk.deployer.deployEditionDrop({
      name: `Testing bundle drop from SDK`,
      description: "Test contract from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      primary_sale_recipient: adminWallet.address,
      seller_fee_basis_points: 500,
      fee_recipient: AddressZero,
      platform_fee_basis_points: 10,
      platform_fee_recipient: adminWallet.address,
    });
    editionDrop = await sdk.getEditionDrop(address);
  });

  it("should estimate gas cost", async () => {
    const cost = await editionDrop.estimator.gasCostOf("lazyMint", [
      1000,
      "mock://12398172398172389/0",
    ]);
    expect(parseFloat(cost)).gt(0);
  });

  it("should allow you to set claim conditions", async () => {
    await editionDrop.createBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);
    await editionDrop.claimConditions.set(BigNumber.from("0"), [{}]);
    const conditions = await editionDrop.claimConditions.getAll(0);
    assert.lengthOf(conditions, 1);
  });

  it("should get all", async () => {
    await editionDrop.createBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);
    const all = await editionDrop.getAll();
    expect(all.length).to.eq(2);
  });

  it("allow all addresses in the merkle tree to claim", async () => {
    await editionDrop.createBatch([
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

    await editionDrop.claimConditions.set("0", [
      {
        maxQuantity: 1000,
        snapshot: members,
      },
    ]);

    for (const member of testWallets) {
      await sdk.wallet.connect(member);
      await editionDrop.claim("0", 1);
    }
    const bundle = await editionDrop.get("0");
    assert(bundle.supply.toNumber() === testWallets.length);

    const claimers = await editionDrop.history.getAllClaimerAddresses("0");
    expect(claimers.length).to.eq(testWallets.length);
    expect(claimers).to.include(bobWallet.address);
  });

  it("allow all addresses in the merkle tree to claim using useSnapshot", async () => {
    await editionDrop.createBatch([
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
    await editionDrop.claimConditions.set("0", [
      {
        maxQuantity: 1000,
        snapshot: members,
      },
    ]);
    testWallets.push(w4);

    for (const member of testWallets) {
      try {
        sdk.wallet.connect(member);
        await editionDrop.claim("0", 1);
      } catch (e) {
        if (member !== w4) {
          throw e;
        }
      }
    }
    const bundle = await editionDrop.get("0");
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
    const result = await editionDrop.createBatch(tokens);
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
    const moreResult = await editionDrop.createBatch(moreTokens);
    assert.lengthOf(moreResult, moreTokens.length);
    for (const token of moreTokens) {
      const found = moreResult.find(
        async (t) => (await t.data()).name === token.name,
      );
      assert.isDefined(found);
    }
  });

  it("should allow setting max claims per wallet", async () => {
    await editionDrop.createBatch([
      { name: "name", description: "description" },
    ]);
    await editionDrop.claimConditions.set(0, [
      {
        snapshot: [
          { address: w1.address, maxClaimable: 2 },
          { address: w2.address, maxClaimable: 1 },
        ],
      },
    ]);
    await sdk.wallet.connect(w1);
    await editionDrop.claim(0, 2);
    try {
      await sdk.wallet.connect(w2);
      await editionDrop.claim(0, 2);
    } catch (e) {
      expectError(e, "invalid quantity proof");
    }
  });

  it("should allow a default claim condition to be used to claim", async () => {
    await editionDrop.createBatch([
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

    await editionDrop.claimConditions.set("0", [{}]);
    await editionDrop.claim("0", 1);
  });

  it("should return addresses of all the claimers", async () => {
    await editionDrop.createBatch([
      {
        name: "test 0",
      },
      {
        name: "test 1",
      },
    ]);

    await editionDrop.claimConditions.set("0", [{}]);
    await editionDrop.claimConditions.set("1", [{}]);
    await editionDrop.claim("0", 1);

    await sdk.wallet.connect(samWallet);
    await editionDrop.claim("0", 1);

    // TODO some asserts
    // const claimers = await bdContract.getAllClaimerAddresses("0");
    // expect(claimers).to.deep.equalInAnyOrder([
    //   samWallet.address,
    //   adminWallet.address,
    // ]);

    await sdk.wallet.connect(w1);
    await editionDrop.claim("1", 1);
    await sdk.wallet.connect(w2);
    await editionDrop.claim("1", 1);

    const ownedW1 = await editionDrop.getOwned(w1.address);
    assert(ownedW1.length === 1);
    const ownedW2 = await editionDrop.getOwned(w2.address);
    assert(ownedW2.length === 1);
  });

  it("should return the correct status if a token can be claimed", async () => {
    await editionDrop.claimConditions.set("0", [
      {
        snapshot: [w1.address],
      },
    ]);

    await sdk.wallet.connect(w1);
    const canClaimW1 = await editionDrop.claimConditions.canClaim("0", 1);
    assert.isTrue(canClaimW1, "w1 should be able to claim");

    await sdk.wallet.connect(w2);
    const canClaimW2 = await editionDrop.claimConditions.canClaim("0", 1);
    assert.isFalse(canClaimW2, "w2 should not be able to claim");
  });

  it("Platform fees", async () => {
    const fees = await editionDrop.platformFees.get();
    expect(fees.platform_fee_recipient).to.eq(adminWallet.address);
    expect(fees.platform_fee_basis_points).to.eq(10);

    await editionDrop.platformFees.set({
      platform_fee_recipient: samWallet.address,
      platform_fee_basis_points: 500,
    });
    const fees2 = await editionDrop.platformFees.get();
    expect(fees2.platform_fee_recipient).to.eq(samWallet.address);
    expect(fees2.platform_fee_basis_points).to.eq(500);
  });

  it("should allow custom overrides", async () => {
    editionDrop.interceptor.overrideNextTransaction(() => ({
      nonce: 5000,
    }));
    try {
      await editionDrop.createBatch([
        {
          name: "test",
          description: "test",
        },
      ]);
    } catch (e) {
      expectError(e, "Expected nonce to be");
    }
  });

  it("canClaim: 1 address", async () => {
    await editionDrop.claimConditions.set("0", [
      {
        snapshot: [w1.address],
      },
    ]);

    assert.isTrue(
      await editionDrop.claimConditions.canClaim("0", 1, w1.address),
      "can claim",
    );
    assert.isFalse(
      await editionDrop.claimConditions.canClaim("0", 1, w2.address),
      "!can claim",
    );
  });

  it("canClaim: 3 address", async () => {
    await editionDrop.claimConditions.set("0", [
      {
        snapshot: [
          w1.address.toUpperCase().replace("0X", "0x"),
          w2.address.toLowerCase(),
          w3.address,
        ],
      },
    ]);

    assert.isTrue(
      await editionDrop.claimConditions.canClaim("0", 1, w1.address),
      "can claim",
    );
    assert.isTrue(
      await editionDrop.claimConditions.canClaim("0", 1, w2.address),
      "can claim",
    );
    assert.isTrue(
      await editionDrop.claimConditions.canClaim("0", 1, w3.address),
      "can claim",
    );
    assert.isFalse(
      await editionDrop.claimConditions.canClaim("0", 1, bobWallet.address),
      "!can claim",
    );
  });

  it("should work when the token has a price", async () => {
    await editionDrop.createBatch([
      {
        name: "test",
        description: "test",
      },
    ]);
    await editionDrop.claimConditions.set("0", [
      {
        price: 1,
      },
    ]);
    await editionDrop.claim("0", 1);
  });

  it("should set multiple claim conditions at once", async () => {
    await editionDrop.createBatch([
      {
        name: "test1",
        description: "test1",
      },
      {
        name: "test2",
        description: "test2",
      },
    ]);
    await editionDrop.claimConditions.setBatch([
      {
        tokenId: 0,
        claimConditions: [
          {
            price: 1,
          },
        ],
      },
      {
        tokenId: 1,
        claimConditions: [
          {
            price: 0.1,
            maxQuantity: 1,
          },
        ],
      },
    ]);
    await editionDrop.claim("0", 2);
    try {
      await editionDrop.claim("1", 2);
    } catch (e) {
      expectError(e, "exceed max mint supply");
    }
  });

  describe("eligibility", () => {
    beforeEach(async () => {
      await editionDrop.createBatch([
        {
          name: "test",
          description: "test",
        },
      ]);
    });

    it("should return false if there isn't an active claim condition", async () => {
      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "0",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NoClaimConditionSet);
      assert.lengthOf(reasons, 1);
      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("set claim condition in the future should not be claimable now", async () => {
      await editionDrop.claimConditions.set(0, [
        {
          startTime: new Date(Date.now() + 60 * 60 * 24 * 1000),
        },
      ]);
      const canClaim = await editionDrop.claimConditions.canClaim(0, 1);
      expect(canClaim).to.eq(false);
    });

    it("should check for the total supply", async () => {
      await editionDrop.claimConditions.set("0", [
        {
          maxQuantity: 1,
        },
      ]);

      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "2",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.NotEnoughSupply);
      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "2",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if an address has valid merkle proofs", async () => {
      await editionDrop.claimConditions.set("0", [
        {
          maxQuantity: 1,
          snapshot: [w2.address, adminWallet.address],
        },
      ]);

      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.AddressNotAllowed);
      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if its been long enough since the last claim", async () => {
      await editionDrop.claimConditions.set("0", [
        {
          maxQuantity: 10,
          waitInSeconds: 24 * 60 * 60,
        },
      ]);
      await sdk.wallet.connect(bobWallet);
      await editionDrop.claim("0", 1);

      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(
        ClaimEligibility.WaitBeforeNextClaimTransaction,
      );
      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "1",
        bobWallet.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough native currency", async () => {
      await editionDrop.claimConditions.set("0", [
        {
          maxQuantity: 10,
          price: "1000000000000000",
          currencyAddress: NATIVE_TOKEN_ADDRESS,
        },
      ]);
      await sdk.wallet.connect(bobWallet);

      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough erc20 currency", async () => {
      const currency = await sdk.getToken(
        await sdk.deployer.deployBuiltInContract(Token.contractType, {
          name: "test",
          symbol: "test",
          primary_sale_recipient: adminWallet.address,
        }),
      );

      await editionDrop.claimConditions.set("0", [
        {
          maxQuantity: 10,
          price: "1000000000000000",
          currencyAddress: currency.getAddress(),
        },
      ]);
      await sdk.wallet.connect(bobWallet);

      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isFalse(canClaim);
    });

    it("should return nothing if the claim is eligible", async () => {
      await editionDrop.claimConditions.set("0", [
        {
          maxQuantity: 10,
          price: "100",
          currencyAddress: NATIVE_TOKEN_ADDRESS,
          snapshot: [w1.address, w2.address, w3.address],
        },
      ]);

      const reasons =
        await editionDrop.claimConditions.getClaimIneligibilityReasons(
          "0",
          "1",
          w1.address,
        );
      assert.lengthOf(reasons, 0);

      const canClaim = await editionDrop.claimConditions.canClaim(
        "0",
        "1",
        w1.address,
      );
      assert.isTrue(canClaim);
    });
  });
  it("should allow you to update claim conditions", async () => {
    await editionDrop.createBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);

    await editionDrop.claimConditions.set(BigNumber.from("0"), [{}]);
    await editionDrop.claimConditions.update(BigNumber.from("0"), 0, {});
    const conditions = await editionDrop.claimConditions.getAll(0);
    assert.lengthOf(conditions, 1);
  });

  it("should return snapshot data on claim conditions", async () => {
    await editionDrop.createBatch([
      { name: "test", description: "test" },
      { name: "test", description: "test" },
    ]);

    await editionDrop.claimConditions.set(0, [
      {
        snapshot: [samWallet.address],
      },
    ]);
    const conditions = await editionDrop.claimConditions.getAll(0);
    assert.lengthOf(conditions, 1);
    invariant(conditions[0].snapshot);
    expect(conditions[0].snapshot[0].address).to.eq(samWallet.address);
  });

  it("should be able to use claim as function expected", async () => {
    await editionDrop.createBatch([
      {
        name: "test",
      },
    ]);
    await editionDrop.claimConditions.set("0", [{}]);
    await editionDrop.claim("0", 1);
    assert((await editionDrop.getOwned()).length > 0);
  });

  it("should be able to use claimTo function as expected", async () => {
    await editionDrop.createBatch([
      {
        name: "test",
      },
    ]);
    await editionDrop.claimConditions.set("0", [{}]);
    await editionDrop.claimTo(samWallet.address, "0", 3);
    assert((await editionDrop.getOwned(samWallet.address)).length === 1);
    assert(
      (await editionDrop.getOwned(samWallet.address))[0].owner ===
        samWallet.address,
    );
    assert(
      (
        await editionDrop.getOwned(samWallet.address)
      )[0].quantityOwned.toNumber() === 3,
    );
  });

  describe("setting merkle claim conditions", () => {
    it("should not overwrite existing merkle keys in the metadata", async () => {
      await editionDrop.createBatch([
        { name: "test", description: "test" },
        { name: "test", description: "test" },
      ]);

      await editionDrop.claimConditions.set("1", [
        {
          snapshot: [w1.address, w2.address, bobWallet.address],
        },
      ]);

      await editionDrop.claimConditions.set("2", [
        {
          snapshot: [w3.address, w1.address, w2.address, adminWallet.address],
        },
      ]);

      const metadata = await editionDrop.metadata.get();
      const merkle: { [key: string]: string } = metadata.merkle;
      assert.lengthOf(Object.keys(merkle), 2);
    });
  });
});
