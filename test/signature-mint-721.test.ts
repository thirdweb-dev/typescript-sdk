import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { BigNumber } from "ethers";
import { NFTCollection } from "../src";
import { sdk, signers } from "./before.test";
import {
  PayloadToSign,
  SignedPayload,
} from "../src/schema/contracts/common/signature";
import { NATIVE_TOKEN_ADDRESS } from "../src/constants/currency";

global.fetch = require("node-fetch");

describe("Voucher Contract", async () => {
  let nftContract: NFTCollection;

  let adminWallet: SignerWithAddress, samWallet: SignerWithAddress;

  let meta: PayloadToSign;

  before(() => {
    [adminWallet, samWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);

    nftContract = sdk.getNFTCollection(
      await sdk.deployer.deployContract(NFTCollection.contractType, {
        name: "OUCH VOUCH",
        symbol: "VOUCH",
        primary_sale_recipient: adminWallet.address,
        seller_fee_basis_points: 0,
      }),
    );

    meta = {
      currencyAddress: NATIVE_TOKEN_ADDRESS,
      metadata: {
        name: "OUCH VOUCH",
      },
      price: "1",
      to: samWallet.address,
      mintEndTime: new Date(Date.now() + 60 * 60 * 24 * 1000 * 1000),
      mintStartTime: new Date(),
    };
  });

  describe("Generating Signatures", () => {
    // let voucher: SignaturePayload;
    // let signature: string, badSignature: string;
    let goodPayload: SignedPayload;
    let badPayload: SignedPayload;

    beforeEach(async () => {
      goodPayload = await nftContract.signature.generate(meta);
      badPayload = await nftContract.signature.generate(meta);
      badPayload.payload.price = BigNumber.from(0);
    });

    it("should generate a valid signature", async () => {
      const valid = await nftContract.signature.verify(goodPayload);
      assert.isTrue(valid, "This voucher should be valid");
    });

    it("should reject invalid signatures", async () => {
      const invalid = await nftContract.signature.verify(badPayload);
      assert.isFalse(
        invalid,
        "This voucher should be invalid because the signature is invalid",
      );
    });

    it("should reject invalid vouchers", async () => {
      goodPayload.payload.price = BigNumber.from(0);
      const invalidModified = await nftContract.signature.verify(goodPayload);
      assert.isFalse(
        invalidModified,
        "This voucher should be invalid because the price was changed",
      );
    });

    it("should generate a valid batch of signatures", async () => {
      const input = [
        {
          ...meta,
          metadata: {
            name: "OUCH VOUCH 0",
          },
        },
        {
          ...meta,
          metadata: {
            name: "OUCH VOUCH 1",
          },
        },
        {
          ...meta,
          metadata: {
            name: "OUCH VOUCH 2",
          },
        },
      ];
      const batch = await nftContract.signature.generateBatch(input);

      for (const [i, v] of batch.entries()) {
        const tx = await nftContract.signature.mint(v);
        const mintedId = (await nftContract.get(tx.id)).metadata.id;
        const nft = await nftContract.get(mintedId);
        assert.equal(input[i].metadata.name, nft.metadata.name);
      }
    });
  });

  describe("Claiming", async () => {
    let v1: SignedPayload, v2: SignedPayload;

    beforeEach(async () => {
      v1 = await nftContract.signature.generate(meta);
      v2 = await nftContract.signature.generate(meta);
    });

    it("should allow a valid voucher to mint", async () => {
      await sdk.updateSignerOrProvider(samWallet);
      const tx = await nftContract.signature.mint(v1);
      const newId = (await nftContract.get(tx.id)).metadata.id;
      assert.equal(newId.toString(), "0");

      await sdk.updateSignerOrProvider(samWallet);
      const tx2 = await nftContract.signature.mint(v2);
      const newId2 = (await nftContract.get(tx2.id)).metadata.id;
      assert.equal(newId2.toString(), "1");
    });

    it("should mint the right metadata", async () => {
      const tx = await nftContract.signature.mint(v1);
      const nft = await nftContract.get(tx.id);
      assert.equal(nft.metadata.name, meta.metadata.name);
    });
  });
});
