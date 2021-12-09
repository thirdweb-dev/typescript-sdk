import { ethers } from "ethers";
import { JsonConvert } from "json2typescript";
import { ClaimProof, Snapshot, ThirdwebSDK } from "../src/index";
import chai = require("chai");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const deepEqualInAnyOrder = require("deep-equal-in-any-order");

chai.use(deepEqualInAnyOrder);

const { expect, assert } = chai;

global.fetch = require("node-fetch");

describe("Snapshots", async () => {
  let sdk: ThirdwebSDK;
  let snapshot: Snapshot;
  let uri: string;
  let merkleRoot: string;

  const leafs = [
    "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
    "0x99703159fbE079e1a48B53039a5e52e7b2d9E559",
    "0x38641f11406E513A187d40600a13C9F921db23c2",
    "0x14fb3a9B317612ddc6d6Cc3c907CD9F2Aa091eE7",
  ];

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(
        process.env.PKEY,
        ethers.getDefaultProvider("https://rpc-mumbai.maticvigil.com"),
      ),
    );

    const result = await sdk.createSnapshot(leafs);
    snapshot = result.snapshot;
    uri = result.snapshotUri;
    merkleRoot = result.merkleRoot;
  });

  it("should generate a valid merkle root from a list of addresses", async () => {
    assert.equal(
      merkleRoot,
      "0254c7a9a0ab177ed354914766f6ee9b0c4a767067d774fd274749bdd6ff06f3",
    );
  });

  it("should warn about duplicate leafs", async () => {
    const duplicateLeafs = [...leafs, ...leafs];

    try {
      await sdk.createSnapshot(duplicateLeafs);
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

    snapshot.claims.forEach((claim: ClaimProof) => {
      assert.isNotEmpty(claim.proof);
    });
  });

  it("should contain a claim for each leaf", () => {
    leafs.forEach((leaf) => {
      assert.notEqual(
        snapshot.claims.find((c: ClaimProof) => c.address === leaf),
        undefined,
      );
    });
  });

  it("should upload the snapshot to storage", async () => {
    const rawSnapshotJson = JSON.parse(await sdk.getStorage().get(uri));
    const convert = new JsonConvert();
    const deserialized = convert.deserializeObject(rawSnapshotJson, Snapshot);
    expect(deserialized).to.deep.equalInAnyOrder(snapshot);
  });

  it("should include the correct proofs for all leafs", () => {});
});
