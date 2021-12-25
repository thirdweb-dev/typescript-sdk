import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import {
  ClaimEligibility,
  DropModule,
  NATIVE_TOKEN_ADDRESS,
} from "../src/index";
import { appModule, sdk, signers } from "./before.test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const keccak256 = require("keccak256");

global.fetch = require("node-fetch");

describe("Drop Module", async () => {
  let dropModule: DropModule;
  let adminWallet,
    samWallet,
    abbyWallet,
    bobWallet,
    w1,
    w2,
    w3,
    w4: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;
    await sdk.setProviderOrSigner(adminWallet);
    dropModule = await appModule.deployDropModule({
      name: "Test Drop",
      maxSupply: 1000,
      primarySaleRecipientAddress: AddressZero,
    });
  });

  it("should allow a snapshot to be set", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date().getTime() / 2000,
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
    ]);

    const secondPhase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await secondPhase.setSnapshot([bobWallet.address]);

    console.log("Setting claim condition");
    await dropModule.setClaimConditions(factory);
    console.log("Claim condition set");

    const { metadata } = await dropModule.getMetadata();
    const merkles: { [key: string]: string } = { ...metadata?.merkle };

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropModule.getAllMintConditions()).map(
      (c) => c.merkleRoot,
    );
    expect(roots).length(2);
  });

  it("should remove merkles from the metadata when claim conditions are removed", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
    ]);

    const secondPhase = factory.newClaimPhase({
      startTime: Math.floor(new Date().getTime() / 1000) + 1000,
    });
    await secondPhase.setSnapshot([bobWallet.address]);

    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");

    const { metadata } = await dropModule.getMetadata();
    const merkles: { [key: string]: string } = metadata?.merkle;

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropModule.getAllMintConditions()).map(
      (c) => c.merkleRoot,
    );
    expect(roots).length(2);

    const newFactory = dropModule.getMintConditionsFactory();
    newFactory.newClaimPhase({
      startTime: new Date(),
    });
    await dropModule.setClaimConditions(newFactory);
    const { metadata: newMetadata } = await dropModule.getMetadata();
    const newMerkles: { [key: string]: string } = newMetadata?.merkle;
    expect(JSON.stringify(newMerkles)).to.eq("{}");
  });

  it("allow all addresses in the merkle tree to claim", async () => {
    const factory = dropModule.getClaimConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
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
    await dropModule.setClaimConditions(factory);

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
      await sdk.setProviderOrSigner(member);
      await dropModule.claim(1);
      console.log(`Address ${member.address} claimed successfully!`);
    }
  });

  it("should correctly upload metadata for each nft", async () => {
    const metadatas = [];
    for (let i = 0; i < 10; i++) {
      metadatas.push({
        name: `test ${i}`,
      });
    }
    await dropModule.lazyMintBatch(metadatas);
    const nfts = await dropModule.getAll();
    expect(nfts.length).to.eq(10);
    let i = 0;
    nfts.forEach((nft) => {
      expect(nft.metadata.name).to.be.equal(`test ${i}`);
      i++;
    });
  });

  it("should not allow claiming to someone not in the merkle tree", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
    ]);
    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");
    console.log("Minting");
    await dropModule.lazyMint({ name: "name", description: "description" });
    console.log("Minted");

    await sdk.setProviderOrSigner(w1);
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
    await dropModule.lazyMint({ name: "name", description: "description" });
    await dropModule.setPublicMintConditions([{ maxMintSupply: 100 }]);
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
    const snapshot = await sdk.createSnapshot(members);
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
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await dropModule.setClaimConditions(factory);
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
      const reasons = await dropModule.getClaimIneligibilityReasons(
        "1",
        bobWallet.address,
      );

      expect(reasons).to.include(ClaimEligibility.NoActiveClaimPhase);
      assert.lengthOf(reasons, 1);
      const canClaim = await dropModule.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check for the total supply", async () => {
      const factory = dropModule.getClaimConditionsFactory();
      factory.newClaimPhase({
        startTime: new Date(),
        maxQuantity: 1,
      });
      await dropModule.setClaimConditions(factory);

      const reasons = await dropModule.getClaimIneligibilityReasons(
        "2",
        w1.address,
      );
      expect(reasons).to.include(ClaimEligibility.NotEnoughSupply);
      const canClaim = await dropModule.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has valid merkle proofs", async () => {
      const factory = dropModule.getClaimConditionsFactory();
      const phase = factory.newClaimPhase({
        startTime: new Date(),
        maxQuantity: 1,
      });
      await phase.setSnapshot([w2.address, adminWallet.address]);
      await dropModule.setClaimConditions(factory);

      const reasons = await dropModule.getClaimIneligibilityReasons(
        "1",
        w1.address,
      );
      expect(reasons).to.include(ClaimEligibility.AddressNotAllowed);
      const canClaim = await dropModule.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if its been long enough since the last claim", async () => {
      const factory = dropModule.getClaimConditionsFactory();
      factory
        .newClaimPhase({
          startTime: new Date(),
          maxQuantity: 10,
        })
        .setWaitTimeBetweenClaims(24 * 60 * 60);
      await dropModule.setClaimConditions(factory);
      await sdk.setProviderOrSigner(bobWallet);
      await dropModule.claim(1);

      const reasons = await dropModule.getClaimIneligibilityReasons(
        "1",
        bobWallet.address,
      );

      expect(reasons).to.include(
        ClaimEligibility.WaitBeforeNextClaimTransaction,
      );
      const canClaim = await dropModule.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough native currency", async () => {
      const factory = dropModule.getClaimConditionsFactory();
      factory
        .newClaimPhase({
          startTime: new Date(),
          maxQuantity: 10,
        })
        .setPrice(
          ethers.utils.parseUnits("1000000000000000"),
          NATIVE_TOKEN_ADDRESS,
        );
      await dropModule.setClaimConditions(factory);
      await sdk.setProviderOrSigner(bobWallet);

      const reasons = await dropModule.getClaimIneligibilityReasons(
        "1",
        bobWallet.address,
      );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await dropModule.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should check if an address has enough erc20 currency", async () => {
      const currency = await appModule.deployCurrencyModule({
        name: "test",
        symbol: "test",
      });

      const factory = dropModule.getClaimConditionsFactory();
      factory
        .newClaimPhase({
          startTime: new Date(),
          maxQuantity: 10,
        })
        .setPrice(
          ethers.utils.parseUnits("1000000000000000"),
          currency.address,
        );
      await dropModule.setClaimConditions(factory);
      await sdk.setProviderOrSigner(bobWallet);

      const reasons = await dropModule.getClaimIneligibilityReasons(
        "1",
        bobWallet.address,
      );

      expect(reasons).to.include(ClaimEligibility.NotEnoughTokens);
      const canClaim = await dropModule.canClaim(w1.address);
      assert.isFalse(canClaim);
    });

    it("should return nothing if the claim is eligible", async () => {
      const factory = dropModule.getClaimConditionsFactory();
      const phase = factory
        .newClaimPhase({
          startTime: new Date(),
          maxQuantity: 10,
        })
        .setPrice(ethers.utils.parseUnits("100"), NATIVE_TOKEN_ADDRESS);
      await phase.setSnapshot([w1.address, w2.address, w3.address]);
      await dropModule.setClaimConditions(factory);

      const reasons = await dropModule.getClaimIneligibilityReasons(
        "1",
        w1.address,
      );
      assert.lengthOf(reasons, 0);

      const canClaim = await dropModule.canClaim("1", w1.address);
      assert.isTrue(canClaim);
    });
  });
});
