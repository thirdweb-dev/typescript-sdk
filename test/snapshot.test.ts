import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createSnapshot, IStorage, Snapshot } from "../src/index";

import { sdk, signers } from "./before.test";
import chai = require("chai");
import { MockStorage } from "./mock/MockStorage";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const deepEqualInAnyOrder = require("deep-equal-in-any-order");

chai.use(deepEqualInAnyOrder);

const { expect, assert } = chai;

global.fetch = require("node-fetch");

describe("Snapshots", async () => {
  let snapshot: Snapshot;
  let uri: string;
  let merkleRoot: string;

  const leafs = [
    "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
    "0x99703159fbE079e1a48B53039a5e52e7b2d9E559",
    "0x38641f11406E513A187d40600a13C9F921db23c2",
    "0x14fb3a9B317612ddc6d6Cc3c907CD9F2Aa091eE7",
  ];

  let storage: IStorage;

  beforeEach(async () => {
    storage = new MockStorage();
  });

  beforeEach(async () => {
    const result = await createSnapshot(leafs, storage);
    snapshot = result.snapshot;
    uri = result.snapshotUri;
    merkleRoot = result.merkleRoot;
  });

  it("should generate a valid merkle root from a list of addresses", async () => {
    assert.equal(
      merkleRoot,
      "0xed194a7138dce33f7dfbcfa95492f4eb414fae6cf51e8994ad70d209579a609d",
    );
  });

  it("should warn about duplicate leafs", async () => {
    const duplicateLeafs = [...leafs, ...leafs];

    try {
      await createSnapshot(duplicateLeafs, storage);
    } catch (error) {
      expect(error).to.have.property("message", "DUPLICATE_LEAFS", "");
      return;
    }

    assert.fail(
      "should not reach this point, exception should have been thrown",
    );
  });

  it("should contain the same number of claims as there are leafs", () => {
    assert.lengthOf(snapshot.claims, leafs.length);
  });

  it("should contain a proof for every claim", () => {
    assert.lengthOf(snapshot.claims, leafs.length);

    snapshot.claims.forEach((claim) => {
      assert.isNotEmpty(claim.proof);
    });
  });

  it("should contain a claim for each leaf", () => {
    leafs.forEach((leaf) => {
      assert.notEqual(
        snapshot.claims.find((c) => c.address === leaf),
        undefined,
      );
    });
  });

  it("should upload the snapshot to storage", async () => {
    const rawSnapshotJson = await storage.get(uri);
    expect(rawSnapshotJson).to.deep.equalInAnyOrder(snapshot);
  });
});
