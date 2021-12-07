import { ethers } from "ethers";
import { ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

describe("Snapshots", async () => {
  let sdk: ThirdwebSDK;

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
  });

  it("should generate a valid merkle root from a list of addresses", async () => {});

  it("should warn about duplicate leafs", () => {});

  it("should generate a valid root", () => {});

  it("should return a valid Snapshot object", () => {});

  it("should upload the snapshot to storage", () => {});

  it("should include the correct proofs for all leafs", () => {});
});
