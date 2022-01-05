import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../src";
import { NFTModule } from "../src/modules/nft";
import { NewSignaturePayload } from "../src/types/signature-minting/NewSignaturePayload";
import { SignaturePayload } from "../src/types/signature-minting/SignaturePayload";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

describe("Voucher Module", async () => {
  let nftModule: NFTModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  let meta: NewSignaturePayload;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);

    nftModule = await appModule.deployNftModule({
      name: "OUCH VOUCH",
      symbol: "VOUCH",
      sellerFeeBasisPoints: 0,
    });

    meta = {
      currencyAddress: NATIVE_TOKEN_ADDRESS,
      metadata: {
        name: "OUCH VOUCH",
      },
      price: ethers.utils.parseUnits("1", 18),
      to: samWallet.address,

      // Claimable for "24 hours"
      mintEndTimeEpochSeconds: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
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
        const mintedId = await nftModule.mintWithSignature(
          v.payload,
          v.signature,
        );
        const nft = await nftModule.get(mintedId.toString());
        assert.equal(input[i].metadata.name, nft.name);
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
      await sdk.setProviderOrSigner(samWallet);
      const newId = await nftModule.mintWithSignature(v1.payload, v1.signature);
      assert.equal(newId.toString(), "0");

      await sdk.setProviderOrSigner(samWallet);
      const newId2 = await nftModule.mintWithSignature(
        v2.payload,
        v2.signature,
      );
      assert.equal(newId2.toString(), "1");
    });

    it("should mint the right metadata", async () => {
      const id = await nftModule.mintWithSignature(v1.payload, v1.signature);
      const nft = await nftModule.get(id.toString());
      expect(nft).to.haveOwnProperty("name", (meta.metadata as any).name);
    });
  });
});
