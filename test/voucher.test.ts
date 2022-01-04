import { NewMintRequest } from "./../src/types/voucher/NewMintRequest";
import { Voucher } from "./../src/types/voucher/Voucher";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
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
  });

  describe("Claiming", async () => {
    let voucher: Voucher, signature: string;

    beforeEach(async () => {
      const v = await voucherModule.generateSignature(meta);
      voucher = v.voucher;
      signature = v.signature;
    });

    it("should allow a valid voucher to mint", async () => {
      await sdk.setProviderOrSigner(samWallet);
      await voucherModule.mint(voucher, signature);
    });
  });
});
