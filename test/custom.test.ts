import { sdk, signers } from "./before.test";
import { expect } from "chai";
import { NFTDrop } from "../src";
import invariant from "tiny-invariant";
import {
  DropERC721__factory,
  VoteERC20__factory,
} from "@thirdweb-dev/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

global.fetch = require("node-fetch");

describe("Custom Contracts", async () => {
  let dropContractAddress: string;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    dropContractAddress = await sdk.deployer.deployContract(
      NFTDrop.contractType,
      {
        name: `Drop`,
        description: "Test contract from tests",
        image:
          "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
        primary_sale_recipient: samWallet.address,
        seller_fee_basis_points: 500,
        fee_recipient: bobWallet.address,
        platform_fee_basis_points: 10,
        platform_fee_recipient: adminWallet.address,
      },
    );
  });

  it("should detect feature: metadata", async () => {
    const c = await sdk.unstable_getCustomContract(
      dropContractAddress,
      DropERC721__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.metadata, "Metadata undefined");
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("Drop");
    await c.metadata.set({
      name: "Drop2",
    });
    const meta2 = await c.metadata.get();
    expect(meta2.name).to.eq("Drop2");
  });

  it("should detect feature: roles", async () => {
    const c = await sdk.unstable_getCustomContract(
      dropContractAddress,
      DropERC721__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.roles, "Roles undefined");
    const admins = await c.roles.get("admin");
    expect(admins[0]).to.eq(adminWallet.address);
    const minters = await c.roles.get("minter");
    expect(minters[0]).to.eq(adminWallet.address);
    expect(minters.length).to.eq(1);
    await c.roles.grant("minter", samWallet.address);
    const minters2 = await c.roles.get("minter");
    expect(minters2.length).to.eq(2);
    expect(minters2[0]).to.eq(adminWallet.address);
    expect(minters2[1]).to.eq(samWallet.address);
  });

  it("should detect feature: royalties", async () => {
    const c = await sdk.unstable_getCustomContract(
      dropContractAddress,
      DropERC721__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.royalties, "Royalties undefined");
    const royalties = await c.royalties.getDefaultRoyaltyInfo();
    expect(royalties.fee_recipient).to.eq(bobWallet.address);
    expect(royalties.seller_fee_basis_points).to.eq(500);
    await c.royalties.setDefaultRoyaltyInfo({
      fee_recipient: samWallet.address,
      seller_fee_basis_points: 1000,
    });
    const royalties2 = await c.royalties.getDefaultRoyaltyInfo();
    expect(royalties2.fee_recipient).to.eq(samWallet.address);
    expect(royalties2.seller_fee_basis_points).to.eq(1000);
  });

  it("should detect feature: primary sales", async () => {
    const c = await sdk.unstable_getCustomContract(
      dropContractAddress,
      DropERC721__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.sales, "Primary sales undefined");
    const recipient = await c.sales.getRecipient();
    expect(recipient).to.eq(samWallet.address);
    await c.sales.setRecipient(bobWallet.address);
    const recipient2 = await c.sales.getRecipient();
    expect(recipient2).to.eq(bobWallet.address);
  });

  it("should detect feature: primary sales", async () => {
    const c = await sdk.unstable_getCustomContract(
      dropContractAddress,
      DropERC721__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.platformFees, "Platform fees undefined");
    const fees = await c.platformFees.get();
    expect(fees.platform_fee_recipient).to.eq(adminWallet.address);
    expect(fees.platform_fee_basis_points).to.eq(10);
    await c.platformFees.set({
      platform_fee_recipient: samWallet.address,
      platform_fee_basis_points: 500,
    });
    const fees2 = await c.platformFees.get();
    expect(fees2.platform_fee_recipient).to.eq(samWallet.address);
    expect(fees2.platform_fee_basis_points).to.eq(500);
  });

  it("should not detect feature if missing from ABI", async () => {
    const c = await sdk.unstable_getCustomContract("", VoteERC20__factory.abi);
    invariant(c, "Contract undefined");
    invariant(c.metadata, "Metadata undefined");
    expect(c.roles).to.eq(undefined);
  });
});
