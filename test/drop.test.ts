import { DropErc721Module } from "../src/modules/drop-erc-721";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber, ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import { appModule, sdk, signers } from "./before.test";
import { createSnapshot } from "../src/common";
import { ClaimEligibility } from "../src/enums";
import { NATIVE_TOKEN_ADDRESS } from "../src/common/currency";
import { TokenErc20Module } from "../src";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const keccak256 = require("keccak256");

global.fetch = require("node-fetch");

describe("Drop Module", async () => {
  let dropModule: DropErc721Module;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    abbyWallet: SignerWithAddress,
    bobWallet: SignerWithAddress,
    w1: SignerWithAddress,
    w2: SignerWithAddress,
    w3: SignerWithAddress,
    w4: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.factory.deploy(DropErc721Module.moduleType, {
      name: `Testing drop from SDK`,
      description: "Test module from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      seller_fee_basis_points: 500,
      fee_recipient: AddressZero,
      platform_fee_basis_points: 10,
      platform_fee_recipient: AddressZero,
    });
    dropModule = sdk.getDropModule(address);
  });

  it("should allow a snapshot to be set", async () => {
    console.log("Setting claim condition");
    await dropModule.claimConditions.set([
      {
        startTime: new Date().getTime() / 2000,
        snapshot: [bobWallet.address, samWallet.address, abbyWallet.address],
      },
      {
        startTime: new Date(),
        snapshot: [bobWallet.address],
      },
    ]);
    console.log("Claim condition set");

    const metadata = await dropModule.metadata.get();
    const merkles = metadata.merkle;

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropModule.claimConditions.getAll()).map(
      (c) => c.merkleRootHash,
    );
    expect(roots).length(2);
  });

  it("should remove merkles from the metadata when claim conditions are removed", async () => {
    await dropModule.claimConditions.set([
      {
        startTime: new Date(),
        waitInSeconds: 10,
        snapshot: [bobWallet.address, samWallet.address, abbyWallet.address],
      },
      {
        startTime: new Date().getTime() / 1000 + 1000,
        snapshot: [bobWallet.address],
      },
    ]);

    const metadata = await dropModule.metadata.get();
    const merkles = metadata.merkle;

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropModule.claimConditions.getAll()).map(
      (c) => c.merkleRootHash,
    );
    expect(roots).length(2);

    await dropModule.claimConditions.set([{}]);
    const newMetadata = await dropModule.metadata.get();
    const newMerkles = newMetadata.merkle;
    expect(JSON.stringify(newMerkles)).to.eq("{}");
  });

  it("allow all addresses in the merkle tree to claim", async () => {
    const testWallets: SignerWithAddress[] = [
      bobWallet,
      samWallet,
      abbyWallet,
      w1,
      w2,
      w3,
      w4,
    ];
    const members = testWallets.map((w, i) =>
      i % 3 === 0
        ? w.address.toLowerCase()
        : i % 3 === 1
        ? w.address.toUpperCase().replace("0X", "0x")
        : w.address,
    );
    console.log("members", members);

    console.log("Setting claim condition");
    await dropModule.claimConditions.set([{ snapshot: members }]);
    console.log("Claim condition set");

    console.log("Minting 100");
    const metadata = [];
    for (let i = 0; i < 10; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    console.log("calling lazy mint batch");
    await dropModule.createBatch(metadata);

    console.log("Minted");
    console.log("Claiming");

    /**
     * Claiming 1 tokens with proofs: 0xe9707d0e6171f728f7473c24cc0432a9b07eaaf1efed6a137a4a8c12c79552d9,0xb1a5bda84b83f7f014abcf0cf69cab5a4de1c3ececa8123a5e4aaacb01f63f83
     */

    for (const member of testWallets) {
      console.log(member.address);
      await sdk.updateSignerOrProvider(member);
      await dropModule.claim(1);
      console.log(`Address ${member.address} claimed successfully!`);
    }
  });

  it("allow one address in the merkle tree to claim", async () => {
    const testWallets: SignerWithAddress[] = [bobWallet];
    const members = testWallets.map((w) => w.address);

    await dropModule.claimConditions.set([{ snapshot: members }]);

    const metadata = [];
    for (let i = 0; i < 2; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    console.log("calling lazy mint batch");
    await dropModule.createBatch(metadata);

    /**
     * Claiming 1 tokens with proofs: 0xe9707d0e6171f728f7473c24cc0432a9b07eaaf1efed6a137a4a8c12c79552d9,0xb1a5bda84b83f7f014abcf0cf69cab5a4de1c3ececa8123a5e4aaacb01f63f83
     */

    for (const member of testWallets) {
      await sdk.updateSignerOrProvider(member);
      await dropModule.claim(1);
      console.log(`Address ${member.address} claimed successfully!`);
    }

    try {
      await sdk.updateSignerOrProvider(samWallet);
      await dropModule.claim(1);
      assert.fail("should have thrown");
    } catch (e) {
      // expected
    }
  });

  it("should correctly upload metadata for each nft", async () => {
    const metadatas = [];
    for (let i = 0; i < 10; i++) {
      metadatas.push({
        name: `test ${i}`,
      });
    }
    await dropModule.createBatch(metadatas);
    const nfts = await dropModule.getAll();
    expect(nfts.length).to.eq(10);
    let i = 0;
    nfts.forEach((nft) => {
      expect(nft.metadata.name).to.be.equal(`test ${i}`);
      i++;
    });
  });

  it("should not allow claiming to someone not in the merkle tree", async () => {
    console.log("Setting claim condition");
    await dropModule.claimConditions.set(
      [
        {
          snapshot: [bobWallet.address, samWallet.address, abbyWallet.address],
        },
      ],
      false,
    );
    console.log("Claim condition set");
    console.log("Minting");
    await dropModule.createBatch([
      { name: "name", description: "description" },
    ]);
    console.log("Minted");

    await sdk.updateSignerOrProvider(w1);
    console.log("Claiming");
    try {
      await dropModule.claim(1);
    } catch (err: any) {
      expect(err).to.have.property(
        "message",
        "No claim found for this address",
        "",
      );
      return;
    }
    assert.fail("should not reach this point, claim should have failed");
  });

  it("should allow claims with default settings", async () => {
    await dropModule.createBatch([
      { name: "name", description: "description" },
    ]);
    await dropModule.claimConditions.set([{}]);
    await dropModule.claim(1);
  });

  it("should generate valid proofs", async () => {
    const members = [
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
      w1.address,
      w2.address,
      w3.address,
      w4.address,
    ];

    const hashedLeafs = members.map((l) => keccak256(l));
    const tree = new MerkleTree(hashedLeafs, keccak256, {
      sort: true,
      sortLeaves: true,
      sortPairs: true,
    });
    const snapshot = await createSnapshot(members, sdk.storage);
    for (const leaf of members) {
      const expectedProof = tree.getHexProof(keccak256(leaf));

      const actualProof = snapshot.snapshot.claims.find(
        (c) => c.address === leaf,
      );
      assert.isDefined(actualProof);
      expect(actualProof?.proof).to.include.ordered.members(expectedProof);

      const verified = tree.verify(
        actualProof?.proof as string[],
        keccak256(leaf),
        tree.getHexRoot(),
      );
      console.log("Leaf verified =", leaf, verified);
    }
  });

  it("should return the newly claimed token", async () => {
    await dropModule.claimConditions.set([{}]);
    await dropModule.createBatch([
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

    try {
      await dropModule.createBatch([
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
    } catch (err) {
      expect(err).to.have.property("message", "Batch already created!", "");
    }

    const token = await dropModule.claim(2);
    assert.lengthOf(token, 2);
  });

  describe("eligibility", () => {
    beforeEach(async () => {
      await dropModule.createBatch([
        {
          name: "test",
          description: "test",
        },
      ]);
    });

    it("should return false if there isn't an active claim condition", async () => {
      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NoActiveClaimPhase);
      assert.lengthOf(reasons, 1);
      const canClaim = await dropModule.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check for the total supply", async () => {
      await dropModule.claimConditions.set([{ maxQuantity: 1 }]);

      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "2",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.NotEnoughSupply);
      const canClaim = await dropModule.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has valid merkle proofs", async () => {
      await dropModule.claimConditions.set([
        { maxQuantity: 1, snapshot: [w2.address, adminWallet.address] },
      ]);

      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "1",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.AddressNotAllowed);
      const canClaim = await dropModule.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if its been long enough since the last claim", async () => {
      await dropModule.claimConditions.set([
        {
          maxQuantity: 10,
          waitInSeconds: 24 * 60 * 60,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);
      await dropModule.claim(1);

      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(
        ClaimEligibility.WaitBeforeNextClaimTransaction,
      );
      const canClaim = await dropModule.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough native currency", async () => {
      await dropModule.claimConditions.set([
        {
          maxQuantity: 10,
          price: ethers.utils.parseUnits("1000000000000000"),
          currencyAddress: NATIVE_TOKEN_ADDRESS,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);

      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await dropModule.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough erc20 currency", async () => {
      const currencyAddress = await sdk.factory.deploy(
        TokenErc20Module.moduleType,
        {
          name: "test",
          symbol: "test",
        },
      );

      await dropModule.claimConditions.set([
        {
          maxQuantity: 10,
          price: ethers.utils.parseUnits("1000000000000000"),
          currencyAddress,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);

      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await dropModule.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should return nothing if the claim is eligible", async () => {
      await dropModule.claimConditions.set([
        {
          maxQuantity: 10,
          price: ethers.utils.parseUnits("100"),
          currencyAddress: NATIVE_TOKEN_ADDRESS,
          snapshot: [w1.address, w2.address, w3.address],
        },
      ]);

      const reasons =
        await dropModule.claimConditions.getClaimIneligibilityReasons(
          "1",
          w1.address,
        );
      assert.lengthOf(reasons, 0);

      const canClaim = await dropModule.claimConditions.canClaim(
        "1",
        w1.address,
      );
      assert.isTrue(canClaim);
    });
  });
  it("should allow you to update claim conditions", async () => {
    await dropModule.claimConditions.set([{}]);

    const conditions = await dropModule.claimConditions.getAll();
    await dropModule.claimConditions.set([{}]);
    assert.lengthOf(conditions, 1);
  });
  it("should be able to use claim as function expected", async () => {
    await dropModule.createBatch([
      {
        name: "test",
      },
    ]);
    await dropModule.claimConditions.set([{}]);
    await dropModule.claim(1);
    assert((await dropModule.getOwned()).length === 1);
  });

  it("should be able to use claimTo function as expected", async () => {
    await dropModule.claimConditions.set([{}]);
    await dropModule.createBatch([
      {
        name: "test",
      },
    ]);
    await dropModule.claimTo(samWallet.address, 1);
    assert((await dropModule.getOwned(samWallet.address)).length === 1);
  });

  it("canClaim: 1 address", async () => {
    const metadata = [];
    for (let i = 0; i < 10; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    await dropModule.createBatch(metadata);

    await dropModule.claimConditions.set([{ snapshot: [w1.address] }]);

    assert.isTrue(
      await dropModule.claimConditions.canClaim(1, w1.address),
      "can claim",
    );
    assert.isFalse(
      await dropModule.claimConditions.canClaim(1, w2.address),
      "!can claim",
    );
  });

  it("canClaim: 3 address", async () => {
    const metadata = [];
    for (let i = 0; i < 10; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    await dropModule.createBatch(metadata);

    const members = [
      w1.address.toUpperCase().replace("0X", "0x"),
      w2.address.toLowerCase(),
      w3.address,
    ];
    await dropModule.claimConditions.set([
      {
        snapshot: members,
      },
    ]);

    assert.isTrue(
      await dropModule.claimConditions.canClaim(1, w1.address),
      "can claim",
    );
    assert.isTrue(
      await dropModule.claimConditions.canClaim(1, w2.address),
      "can claim",
    );
    assert.isTrue(
      await dropModule.claimConditions.canClaim(1, w3.address),
      "can claim",
    );
    assert.isFalse(
      await dropModule.claimConditions.canClaim(1, bobWallet.address),
      "!can claim",
    );
  });

  it("set claim condition and reset claim condition", async () => {
    await dropModule.claimConditions.set([
      { startTime: new Date().getTime() / 2000 },
      { startTime: new Date().getTime() },
    ]);
    expect((await dropModule.claimConditions.getAll()).length).to.be.equal(2);

    await dropModule.claimConditions.set([]);
    expect((await dropModule.claimConditions.getAll()).length).to.be.equal(0);
  });

  it("set claim condition and update claim condition", async () => {
    await dropModule.claimConditions.set([
      { startTime: new Date().getTime() / 2000, maxQuantity: 1 },
      { startTime: new Date().getTime(), waitInSeconds: 60 },
    ]);
    expect((await dropModule.claimConditions.getAll()).length).to.be.equal(2);

    await dropModule.claimConditions.update(0, { waitInSeconds: 10 });
    let updatedConditions = await dropModule.claimConditions.getAll();
    expect(updatedConditions[0].maxQuantity).to.be.deep.equal(
      BigNumber.from(1),
    );
    expect(updatedConditions[0].waitInSeconds).to.be.deep.equal(
      BigNumber.from(10),
    );
    expect(updatedConditions[1].waitInSeconds).to.be.deep.equal(
      BigNumber.from(60),
    );

    await dropModule.claimConditions.update(1, {
      maxQuantity: 10,
      waitInSeconds: 10,
    });
    updatedConditions = await dropModule.claimConditions.getAll();
    expect(updatedConditions[0].maxQuantity).to.be.deep.equal(
      BigNumber.from(1),
    );
    expect(updatedConditions[1].maxQuantity).to.be.deep.equal(
      BigNumber.from(10),
    );
    expect(updatedConditions[1].waitInSeconds).to.be.deep.equal(
      BigNumber.from(10),
    );
  });

  it("set claim condition and update claim condition with diff timestamps should reorder", async () => {
    await dropModule.claimConditions.set([
      { startTime: new Date().getTime() / 2000, maxQuantity: 1 },
      { startTime: new Date().getTime(), maxQuantity: 2 },
    ]);
    expect((await dropModule.claimConditions.getAll()).length).to.be.equal(2);

    await dropModule.claimConditions.update(0, {
      startTime: new Date().getTime() * 2,
    });
    // max quantities should be inverted now
    const updatedConditions = await dropModule.claimConditions.getAll();
    expect(updatedConditions[0].maxQuantity).to.be.deep.equal(
      BigNumber.from(2),
    );
    expect(updatedConditions[1].maxQuantity).to.be.deep.equal(
      BigNumber.from(1),
    );
  });

  describe("Delay Reveal", () => {
    it("metadata should reveal correctly", async () => {
      await dropModule.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #1",
        },
        [{ name: "NFT #1" }, { name: "NFT #2" }],
        "my secret password",
      );

      expect((await dropModule.get("0")).metadata.name).to.be.equal(
        "Placeholder #1",
      );

      await dropModule.revealer.reveal(0, "my secret password");

      expect((await dropModule.get("0")).metadata.name).to.be.equal("NFT #1");
    });

    it("different reveal order and should return correct unreveal list", async () => {
      await dropModule.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #1",
        },
        [
          {
            name: "NFT #1",
          },
          {
            name: "NFT #2",
          },
        ],
        "my secret key",
      );

      await dropModule.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #2",
        },
        [
          {
            name: "NFT #3",
          },
          {
            name: "NFT #4",
          },
        ],
        "my secret key",
      );

      await dropModule.createBatch([
        {
          name: "NFT #00",
        },
        {
          name: "NFT #01",
        },
      ]);

      await dropModule.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #3",
        },
        [
          {
            name: "NFT #5",
          },
          {
            name: "NFT #6",
          },
          {
            name: "NFT #7",
          },
        ],
        "my secret key",
      );

      let unrevealList = await dropModule.revealer.getBatchesToReveal();
      expect(unrevealList.length).to.be.equal(3);
      expect(unrevealList[0].batchId.toNumber()).to.be.equal(0);
      expect(unrevealList[0].placeholderMetadata.name).to.be.equal(
        "Placeholder #1",
      );
      expect(unrevealList[1].batchId.toNumber()).to.be.equal(1);
      expect(unrevealList[1].placeholderMetadata.name).to.be.equal(
        "Placeholder #2",
      );
      // skipped 2 because it is a revealed batch
      expect(unrevealList[2].batchId.toNumber()).to.be.equal(3);
      expect(unrevealList[2].placeholderMetadata.name).to.be.equal(
        "Placeholder #3",
      );

      await dropModule.revealer.reveal(
        unrevealList[0].batchId,
        "my secret key",
      );

      unrevealList = await dropModule.revealer.getBatchesToReveal();
      expect(unrevealList.length).to.be.equal(2);
      expect(unrevealList[0].batchId.toNumber()).to.be.equal(1);
      expect(unrevealList[0].placeholderMetadata.name).to.be.equal(
        "Placeholder #2",
      );
      expect(unrevealList[1].batchId.toNumber()).to.be.equal(3);
      expect(unrevealList[1].placeholderMetadata.name).to.be.equal(
        "Placeholder #3",
      );

      await dropModule.revealer.reveal(
        unrevealList[unrevealList.length - 1].batchId,
        "my secret key",
      );

      unrevealList = await dropModule.revealer.getBatchesToReveal();
      expect(unrevealList.length).to.be.equal(1);
      expect(unrevealList[0].batchId.toNumber()).to.be.equal(1);
      expect(unrevealList[0].placeholderMetadata.name).to.be.equal(
        "Placeholder #2",
      );
    });

    it("should not be able to re-used published password for next batch", async () => {
      await dropModule.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #1",
        },
        [{ name: "NFT #1" }, { name: "NFT #2" }],
        "my secret password",
      );
      await dropModule.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #2",
        },
        [{ name: "NFT #3" }, { name: "NFT #4" }],
        "my secret password",
      );
      await dropModule.revealer.reveal(0, "my secret password");
      const transactions = (
        await adminWallet.provider.getBlockWithTransactions()
      ).transactions;

      const { index, _key } = dropModule.encoder.decode(
        "reveal",
        transactions[0].data,
      );

      // re-using broadcasted _key to decode :)
      try {
        await dropModule.revealer.reveal(index.add(1), _key);
        assert.fail("should not be able to re-used published password");
      } catch (e) {
        expect(e.message).to.be.equal("invalid password");
      }

      // original password should work
      await dropModule.revealer.reveal(1, "my secret password");
    });
  });
});
