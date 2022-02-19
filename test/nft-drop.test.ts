import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { MerkleTree } from "merkletreejs";
import { sdk, signers, storage } from "./before.test";
import { createSnapshot } from "../src/common";
import { ClaimEligibility } from "../src/enums";
import { NFTDrop, Token } from "../src";
import { NATIVE_TOKEN_ADDRESS } from "../src/constants/currency";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const keccak256 = require("keccak256");

global.fetch = require("node-fetch");

describe("NFT Drop Contract", async () => {
  let dropContract: NFTDrop;
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
    const address = await sdk.deployer.deployNFTDrop({
      name: `Testing drop from SDK`,
      description: "Test contract from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      primary_sale_recipient: adminWallet.address,
      seller_fee_basis_points: 500,
      fee_recipient: AddressZero,
      platform_fee_basis_points: 10,
      platform_fee_recipient: AddressZero,
    });
    dropContract = sdk.getNFTDrop(address);
  });

  it("should allow a snapshot to be set", async () => {
    console.log("Setting claim condition");
    await dropContract.claimConditions.set([
      {
        startTime: new Date(Date.now() / 2),
        snapshot: [bobWallet.address, samWallet.address, abbyWallet.address],
        price: 1,
      },
      {
        startTime: new Date(),
        snapshot: [bobWallet.address],
      },
    ]);
    console.log("Claim condition set");

    const metadata = await dropContract.metadata.get();
    const merkles = metadata.merkle;

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropContract.claimConditions.getAll()).map(
      (c) => c.merkleRootHash,
    );
    expect(roots).length(2);
  });

  it("should remove merkles from the metadata when claim conditions are removed", async () => {
    await dropContract.claimConditions.set([
      {
        startTime: new Date(),
        waitInSeconds: 10,
        snapshot: [bobWallet.address, samWallet.address, abbyWallet.address],
      },
      {
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        snapshot: [bobWallet.address],
      },
    ]);

    const metadata = await dropContract.metadata.get();
    const merkles = metadata.merkle;

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropContract.claimConditions.getAll()).map(
      (c) => c.merkleRootHash,
    );
    expect(roots).length(2);

    await dropContract.claimConditions.set([{}]);
    const newMetadata = await dropContract.metadata.get();
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
    await dropContract.claimConditions.set([{ snapshot: members }]);
    console.log("Claim condition set");

    console.log("Minting 100");
    const metadata = [];
    for (let i = 0; i < 10; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    console.log("calling lazy mint batch");
    await dropContract.createBatch(metadata);

    console.log("Minted");
    console.log("Claiming");

    /**
     * Claiming 1 tokens with proofs: 0xe9707d0e6171f728f7473c24cc0432a9b07eaaf1efed6a137a4a8c12c79552d9,0xb1a5bda84b83f7f014abcf0cf69cab5a4de1c3ececa8123a5e4aaacb01f63f83
     */

    for (const member of testWallets) {
      console.log(member.address);
      await sdk.updateSignerOrProvider(member);
      await dropContract.claim(1);
      console.log(`Address ${member.address} claimed successfully!`);
    }
  });

  it("allow one address in the merkle tree to claim", async () => {
    const testWallets: SignerWithAddress[] = [bobWallet];
    const members = testWallets.map((w) => w.address);

    await dropContract.claimConditions.set([{ snapshot: members }]);

    const metadata = [];
    for (let i = 0; i < 2; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    console.log("calling lazy mint batch");
    await dropContract.createBatch(metadata);

    /**
     * Claiming 1 tokens with proofs: 0xe9707d0e6171f728f7473c24cc0432a9b07eaaf1efed6a137a4a8c12c79552d9,0xb1a5bda84b83f7f014abcf0cf69cab5a4de1c3ececa8123a5e4aaacb01f63f83
     */

    for (const member of testWallets) {
      await sdk.updateSignerOrProvider(member);
      await dropContract.claim(1);
      console.log(`Address ${member.address} claimed successfully!`);
    }

    try {
      await sdk.updateSignerOrProvider(samWallet);
      await dropContract.claim(1);
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
    await dropContract.createBatch(metadatas);
    const nfts = await dropContract.getAll();
    expect(nfts.length).to.eq(10);
    let i = 0;
    nfts.forEach((nft) => {
      expect(nft.metadata.name).to.be.equal(`test ${i}`);
      i++;
    });
  });

  it("should not allow claiming to someone not in the merkle tree", async () => {
    console.log("Setting claim condition");
    await dropContract.claimConditions.set(
      [
        {
          snapshot: [bobWallet.address, samWallet.address, abbyWallet.address],
        },
      ],
      false,
    );
    console.log("Claim condition set");
    console.log("Minting");
    await dropContract.createBatch([
      { name: "name", description: "description" },
    ]);
    console.log("Minted");

    await sdk.updateSignerOrProvider(w1);
    console.log("Claiming");
    try {
      await dropContract.claim(1);
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
    await dropContract.createBatch([
      { name: "name", description: "description" },
    ]);
    await dropContract.claimConditions.set([{}]);
    await dropContract.claim(1);
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
    const snapshot = await createSnapshot(members, storage);
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
    await dropContract.claimConditions.set([{}]);
    await dropContract.createBatch([
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
      await dropContract.createBatch([
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

    const token = await dropContract.claim(2);
    assert.lengthOf(token, 2);
  });

  describe("eligibility", () => {
    beforeEach(async () => {
      await dropContract.createBatch([
        {
          name: "test",
          description: "test",
        },
      ]);
    });

    it("should return false if there isn't an active claim condition", async () => {
      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NoActiveClaimPhase);
      assert.lengthOf(reasons, 1);
      const canClaim = await dropContract.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check for the total supply", async () => {
      await dropContract.claimConditions.set([{ maxQuantity: 1 }]);

      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "2",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.NotEnoughSupply);
      const canClaim = await dropContract.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has valid merkle proofs", async () => {
      await dropContract.claimConditions.set([
        { maxQuantity: 1, snapshot: [w2.address, adminWallet.address] },
      ]);

      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "1",
          w1.address,
        );
      expect(reasons).to.include(ClaimEligibility.AddressNotAllowed);
      const canClaim = await dropContract.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if its been long enough since the last claim", async () => {
      await dropContract.claimConditions.set([
        {
          maxQuantity: 10,
          waitInSeconds: 24 * 60 * 60,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);
      await dropContract.claim(1);

      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(
        ClaimEligibility.WaitBeforeNextClaimTransaction,
      );
      const canClaim = await dropContract.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough native currency", async () => {
      await dropContract.claimConditions.set([
        {
          maxQuantity: 10,
          price: "1000000000000000",
          currencyAddress: NATIVE_TOKEN_ADDRESS,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);

      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await dropContract.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough erc20 currency", async () => {
      const currencyAddress = await sdk.deployer.deployContract(
        Token.contractType,
        {
          name: "test",
          symbol: "test",
        },
      );

      await dropContract.claimConditions.set([
        {
          maxQuantity: 10,
          price: "1000000000000000",
          currencyAddress,
        },
      ]);
      await sdk.updateSignerOrProvider(bobWallet);

      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "1",
          bobWallet.address,
        );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await dropContract.claimConditions.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should return nothing if the claim is eligible", async () => {
      await dropContract.claimConditions.set([
        {
          maxQuantity: 10,
          price: "100",
          currencyAddress: NATIVE_TOKEN_ADDRESS,
          snapshot: [w1.address, w2.address, w3.address],
        },
      ]);

      const reasons =
        await dropContract.claimConditions.getClaimIneligibilityReasons(
          "1",
          w1.address,
        );
      assert.lengthOf(reasons, 0);

      const canClaim = await dropContract.claimConditions.canClaim(
        "1",
        w1.address,
      );
      assert.isTrue(canClaim);
    });
  });
  it("should allow you to update claim conditions", async () => {
    await dropContract.claimConditions.set([{}]);

    const conditions = await dropContract.claimConditions.getAll();
    await dropContract.claimConditions.set([{}]);
    assert.lengthOf(conditions, 1);
  });
  it("should be able to use claim as function expected", async () => {
    await dropContract.createBatch([
      {
        name: "test",
      },
    ]);
    await dropContract.claimConditions.set([{}]);
    await dropContract.claim(1);
    assert((await dropContract.getOwned()).length === 1);
  });

  it("should be able to use claimTo function as expected", async () => {
    await dropContract.claimConditions.set([{}]);
    await dropContract.createBatch([
      {
        name: "test",
      },
    ]);
    await dropContract.claimTo(samWallet.address, 1);
    assert((await dropContract.getOwned(samWallet.address)).length === 1);
  });

  it("canClaim: 1 address", async () => {
    const metadata = [];
    for (let i = 0; i < 10; i++) {
      metadata.push({
        name: `test ${i}`,
      });
    }
    await dropContract.createBatch(metadata);

    await dropContract.claimConditions.set([{ snapshot: [w1.address] }]);

    assert.isTrue(
      await dropContract.claimConditions.canClaim(1, w1.address),
      "can claim",
    );
    assert.isFalse(
      await dropContract.claimConditions.canClaim(1, w2.address),
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
    await dropContract.createBatch(metadata);

    const members = [
      w1.address.toUpperCase().replace("0X", "0x"),
      w2.address.toLowerCase(),
      w3.address,
    ];
    await dropContract.claimConditions.set([
      {
        snapshot: members,
      },
    ]);

    assert.isTrue(
      await dropContract.claimConditions.canClaim(1, w1.address),
      "can claim",
    );
    assert.isTrue(
      await dropContract.claimConditions.canClaim(1, w2.address),
      "can claim",
    );
    assert.isTrue(
      await dropContract.claimConditions.canClaim(1, w3.address),
      "can claim",
    );
    assert.isFalse(
      await dropContract.claimConditions.canClaim(1, bobWallet.address),
      "!can claim",
    );
  });

  it("set claim condition and reset claim condition", async () => {
    await dropContract.claimConditions.set([
      { startTime: new Date(Date.now() / 2) },
      { startTime: new Date() },
    ]);
    expect((await dropContract.claimConditions.getAll()).length).to.be.equal(2);

    await dropContract.claimConditions.set([]);
    expect((await dropContract.claimConditions.getAll()).length).to.be.equal(0);
  });

  it("set claim condition and update claim condition", async () => {
    await dropContract.claimConditions.set([
      { startTime: new Date(Date.now() / 2), maxQuantity: 1 },
      { startTime: new Date(), waitInSeconds: 60 },
    ]);
    expect((await dropContract.claimConditions.getAll()).length).to.be.equal(2);

    await dropContract.claimConditions.update(0, { waitInSeconds: 10 });
    let updatedConditions = await dropContract.claimConditions.getAll();
    expect(updatedConditions[0].maxQuantity).to.be.deep.equal(
      BigNumber.from(1),
    );
    expect(updatedConditions[0].waitInSeconds).to.be.deep.equal(
      BigNumber.from(10),
    );
    expect(updatedConditions[1].waitInSeconds).to.be.deep.equal(
      BigNumber.from(60),
    );

    await dropContract.claimConditions.update(1, {
      maxQuantity: 10,
      waitInSeconds: 10,
    });
    updatedConditions = await dropContract.claimConditions.getAll();
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
    await dropContract.claimConditions.set([
      { startTime: new Date(Date.now() / 2), maxQuantity: 1 },
      { startTime: new Date(), maxQuantity: 2 },
    ]);
    expect((await dropContract.claimConditions.getAll()).length).to.be.equal(2);

    await dropContract.claimConditions.update(0, {
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    // max quantities should be inverted now
    const updatedConditions = await dropContract.claimConditions.getAll();
    expect(updatedConditions[0].maxQuantity).to.be.deep.equal(
      BigNumber.from(2),
    );
    expect(updatedConditions[1].maxQuantity).to.be.deep.equal(
      BigNumber.from(1),
    );
  });

  it("set claim condition in the future should not be claimable now", async () => {
    await dropContract.claimConditions.set([
      {
        startTime: new Date(Date.now() + 60 * 60 * 24 * 1000 * 1000),
      },
    ]);
    const canClaim = await dropContract.claimConditions.canClaim(1);
    expect(canClaim).to.eq(false);
  });

  describe("Delay Reveal", () => {
    it("metadata should reveal correctly", async () => {
      await dropContract.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #1",
        },
        [{ name: "NFT #1" }, { name: "NFT #2" }],
        "my secret password",
      );

      expect((await dropContract.get("0")).metadata.name).to.be.equal(
        "Placeholder #1",
      );

      await dropContract.revealer.reveal(0, "my secret password");

      expect((await dropContract.get("0")).metadata.name).to.be.equal("NFT #1");
    });

    it("different reveal order and should return correct unreveal list", async () => {
      await dropContract.revealer.createDelayRevealBatch(
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

      await dropContract.revealer.createDelayRevealBatch(
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

      await dropContract.createBatch([
        {
          name: "NFT #00",
        },
        {
          name: "NFT #01",
        },
      ]);

      await dropContract.revealer.createDelayRevealBatch(
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

      let unrevealList = await dropContract.revealer.getBatchesToReveal();
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

      await dropContract.revealer.reveal(
        unrevealList[0].batchId,
        "my secret key",
      );

      unrevealList = await dropContract.revealer.getBatchesToReveal();
      expect(unrevealList.length).to.be.equal(2);
      expect(unrevealList[0].batchId.toNumber()).to.be.equal(1);
      expect(unrevealList[0].placeholderMetadata.name).to.be.equal(
        "Placeholder #2",
      );
      expect(unrevealList[1].batchId.toNumber()).to.be.equal(3);
      expect(unrevealList[1].placeholderMetadata.name).to.be.equal(
        "Placeholder #3",
      );

      await dropContract.revealer.reveal(
        unrevealList[unrevealList.length - 1].batchId,
        "my secret key",
      );

      unrevealList = await dropContract.revealer.getBatchesToReveal();
      expect(unrevealList.length).to.be.equal(1);
      expect(unrevealList[0].batchId.toNumber()).to.be.equal(1);
      expect(unrevealList[0].placeholderMetadata.name).to.be.equal(
        "Placeholder #2",
      );
    });

    it("should not be able to re-used published password for next batch", async () => {
      await dropContract.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #1",
        },
        [{ name: "NFT #1" }, { name: "NFT #2" }],
        "my secret password",
      );
      await dropContract.revealer.createDelayRevealBatch(
        {
          name: "Placeholder #2",
        },
        [{ name: "NFT #3" }, { name: "NFT #4" }],
        "my secret password",
      );
      await dropContract.revealer.reveal(0, "my secret password");
      const transactions = (
        await adminWallet.provider.getBlockWithTransactions()
      ).transactions;

      const { index, _key } = dropContract.encoder.decode(
        "reveal",
        transactions[0].data,
      );

      // re-using broadcasted _key to decode :)
      try {
        await dropContract.revealer.reveal(index.add(1), _key);
        assert.fail("should not be able to re-used published password");
      } catch (e) {
        expect(e.message).to.be.equal("invalid password");
      }

      // original password should work
      await dropContract.revealer.reveal(1, "my secret password");
    });
  });
});
