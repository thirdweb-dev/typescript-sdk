import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "ethers";
import { TokenErc721Module } from "../src";
import { sdk, signers } from "./before.test";
import {
  NewSignaturePayload,
  SignaturePayload,
} from "../src/schema/modules/common/signature";
import { NATIVE_TOKEN_ADDRESS } from "../src/constants/currency";

global.fetch = require("node-fetch");

describe("Voucher Module", async () => {
  let nftModule: TokenErc721Module;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  let meta: NewSignaturePayload;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);

    nftModule = sdk.getNFTModule(
      await sdk.factory.deploy(TokenErc721Module.moduleType, {
        name: "OUCH VOUCH",
        symbol: "VOUCH",
        seller_fee_basis_points: 0,
      }),
    );

    meta = {
      currencyAddress: NATIVE_TOKEN_ADDRESS,
      metadata: {
        name: "OUCH VOUCH",
      },
      price: ethers.utils.parseUnits("1", 18),
      to: samWallet.address,

      // Claimable for "24 hours"
      // Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      mintEndTimeEpochSeconds: ethers.BigNumber.from(
        "0xffffffffffffffffffffffffffffffff",
      ),
      // Math.floor(Date.now() / 1000),
      mintStartTimeEpochSeconds: 0,
    };
  });

  describe("Generating Signatures", () => {
    let voucher: SignaturePayload;
    let signature, badSignature: string;

    beforeEach(async () => {
      const { payload: v, signature: s } = await nftModule.generateSignature(
        meta,
      );
      const { signature: bS } = await nftModule.generateSignature({
        ...meta,
        price: 0,
      });
      voucher = v;
      signature = s;
      badSignature = bS;
    });

    it("should generate a valid signature", async () => {
      const valid = await nftModule.verify(voucher, signature);
      assert.isTrue(valid, "This voucher should be valid");
    });

    it("should reject invalid signatures", async () => {
      const invalid = await nftModule.verify(voucher, badSignature);
      assert.isFalse(
        invalid,
        "This voucher should be invalid because the signature is invalid",
      );
    });

    it("should reject invalid vouchers", async () => {
      voucher.price = 0;
      const invalidModified = await nftModule.verify(voucher, signature);
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
      const batch = await nftModule.generateSignatureBatch(input);

      for (const [i, v] of batch.entries()) {
        const tx = await nftModule.mintWithSignature(v.payload, v.signature);
        const mintedId = (await tx.data()).metadata.id;
        const nft = await nftModule.get(mintedId);
        assert.equal(input[i].metadata.name, nft.metadata.name);
      }
    });
  });

  describe("Claiming", async () => {
    let v1, v2: { payload: SignaturePayload; signature: string };

    beforeEach(async () => {
      v1 = await nftModule.generateSignature(meta);
      v2 = await nftModule.generateSignature(meta);
    });

    it("should allow a valid voucher to mint", async () => {
      await sdk.updateSignerOrProvider(samWallet);
      const tx = await nftModule.mintWithSignature(v1.payload, v1.signature);
      const newId = (await tx.data()).metadata.id;
      assert.equal(newId.toString(), "0");

      await sdk.updateSignerOrProvider(samWallet);
      const tx2 = await nftModule.mintWithSignature(v2.payload, v2.signature);
      const newId2 = (await tx2.data()).metadata.id;
      assert.equal(newId2.toString(), "1");
    });

    it("should mint the right metadata", async () => {
      const tx = await nftModule.mintWithSignature(v1.payload, v1.signature);
      const id = (await tx.data()).metadata.id;
      const nft = await nftModule.get(id);
      assert.equal(nft.metadata.name, meta.metadata.name);
    });
  });
});
