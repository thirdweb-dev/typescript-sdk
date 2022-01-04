import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { ethers } from "ethers";
import { NATIVE_TOKEN_ADDRESS, VoucherModule } from "../src";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

describe("Vote Module", async () => {
  let voucherModule: VoucherModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

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
  });

  it("should generate valid signatures", async () => {
    const meta = {
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

    const { voucher, signature } = await voucherModule.generateSignature(meta);
    const { signature: badSignature } = await voucherModule.generateSignature({
      ...meta,
      price: 0,
    });

    const valid = await voucherModule.verify(voucher, signature);
    assert.isTrue(valid, "This voucher should be valid");

    console.log(signature);

    const invalid = await voucherModule.verify(voucher, badSignature);
    assert.isFalse(
      invalid,
      "This voucher should be invalid because the signature is invalid",
    );

    voucher.price = 0;
    const invalidModified = await voucherModule.verify(voucher, signature);
    assert.isFalse(
      invalidModified,
      "This voucher should be invalid because the price was changed",
    );
  });
});
