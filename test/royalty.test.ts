import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Edition } from "../src/index";
import { sdk, signers } from "./before-setup";

import { expect } from "chai";

global.fetch = require("cross-fetch");

describe("Royalties", async () => {
  let editionContract: Edition;

  let adminWallet: SignerWithAddress, samWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet] = signers;
  });

  beforeEach(async () => {
    sdk.wallet.connect(adminWallet);

    editionContract = await sdk.getEdition(
      await sdk.deployer.deployBuiltInContract(Edition.contractType, {
        name: "NFT Contract",
        primary_sale_recipient: adminWallet.address,
        fee_recipient: adminWallet.address,
        seller_fee_basis_points: 1000,
      }),
    );

    await editionContract.mintToSelf({
      metadata: {
        name: "Cool NFT",
      },
      supply: 100,
    });
  });

  it("should return default royalty", async () => {
    const info = await editionContract.royalties.getDefaultRoyaltyInfo();
    expect(info.fee_recipient).to.eq(adminWallet.address);
    expect(info.seller_fee_basis_points).to.eq(1000);
  });

  it("should set default royalty", async () => {
    await editionContract.royalties.setDefaultRoyaltyInfo({
      fee_recipient: samWallet.address,
      seller_fee_basis_points: 500,
    });
    const info = await editionContract.royalties.getDefaultRoyaltyInfo();
    expect(info.fee_recipient).to.eq(samWallet.address);
    expect(info.seller_fee_basis_points).to.eq(500);
  });

  it("should return per token royalty", async () => {
    const info = await editionContract.royalties.getTokenRoyaltyInfo("0");
    expect(info.fee_recipient).to.eq(adminWallet.address);
    expect(info.seller_fee_basis_points).to.eq(1000);
  });

  it("should set per token royalty", async () => {
    await editionContract.royalties.setTokenRoyaltyInfo("0", {
      fee_recipient: samWallet.address,
      seller_fee_basis_points: 500,
    });
    const info = await editionContract.royalties.getTokenRoyaltyInfo("0");
    expect(info.fee_recipient).to.eq(samWallet.address);
    expect(info.seller_fee_basis_points).to.eq(500);
  });
});
