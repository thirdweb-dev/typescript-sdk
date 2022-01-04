import { NewMintRequest } from "./../src/types/voucher/NewMintRequest";
import { Voucher } from "./../src/types/voucher/Voucher";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "ethers";
import { NATIVE_TOKEN_ADDRESS, VoucherModule } from "../src";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

describe("Voucher Module", async () => {
  let voucherModule: VoucherModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  let meta: NewMintRequest;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);

    voucherModule = await appModule.deployVoucherModule({
      name: "OUCH VOUCH",
      symbol: "VOUCH",
      defaultSaleRecipientAddress: bobWallet.address,
    });

    meta = {
      currencyAddress: NATIVE_TOKEN_ADDRESS,
      metadata: {
        name: "OUCH VOUCH",
      },
      price: ethers.utils.parseUnits("1", 18),
      to: samWallet.address,

      // Claimable for "24 hours"
      voucherEndTimeEpochSeconds: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      voucherStartTimeEpochSeconds: Math.floor(Date.now() / 1000),
    };
  });

  describe("Generating Signatures", () => {
    let voucher: Voucher;
    let signature, badSignature: string;

    beforeEach(async () => {
      const { voucher: v, signature: s } =
        await voucherModule.generateSignature(meta);
      const { signature: bS } = await voucherModule.generateSignature({
        ...meta,
        price: 0,
      });
      voucher = v;
      signature = s;
      badSignature = bS;
    });

    it("should generate verify a valid signature", async () => {
      console.log(voucher, signature);
      const valid = await voucherModule.verify(voucher, signature);
      assert.isTrue(valid, "This voucher should be valid");
    });

    it("should reject invalid signatures", async () => {
      const invalid = await voucherModule.verify(voucher, badSignature);
      assert.isFalse(
        invalid,
        "This voucher should be invalid because the signature is invalid",
      );
    });

    it("should reject invalid vouchers", async () => {
      voucher.price = 0;
      const invalidModified = await voucherModule.verify(voucher, signature);
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
      const batch = await voucherModule.generateSignatureBatch(input);

      for (const [i, v] of batch.entries()) {
        const mintedId = await voucherModule.mint(v.voucher, v.signature);
        const nft = await voucherModule.get(mintedId);
        assert.equal(input[i].metadata.name, nft.name);
      }
    });
  });

  describe("Claiming", async () => {
    let v1, v2: { voucher: Voucher; signature: string };

    beforeEach(async () => {
      v1 = await voucherModule.generateSignature(meta);
      v2 = await voucherModule.generateSignature(meta);
    });

    it("should allow a valid voucher to mint", async () => {
      await sdk.setProviderOrSigner(samWallet);
      const newId = await voucherModule.mint(v1.voucher, v1.signature);
      assert.equal(newId.toString(), "0");

      await sdk.setProviderOrSigner(samWallet);
      const newId2 = await voucherModule.mint(v2.voucher, v2.signature);
      assert.equal(newId2.toString(), "1");
    });

    it("should mint the right metadata", async () => {
      const id = await voucherModule.mint(v1.voucher, v1.signature);
      const nft = await voucherModule.get(id.toString());
      expect(nft).to.haveOwnProperty("name", (meta.metadata as any).name);
    });
  });

  describe("Balances", () => {});
});
