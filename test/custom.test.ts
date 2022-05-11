import { sdk, signers } from "./before-setup";
import { expect } from "chai";
import invariant from "tiny-invariant";
import {
  TokenERC1155__factory,
  TokenERC20__factory,
  TokenERC721__factory,
  VoteERC20__factory,
} from "contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { uploadContractMetadata } from "./publisher.test";

require("./before-setup");

global.fetch = require("node-fetch");

describe("Custom Contracts", async () => {
  let customContractAddress: string;
  let nftContractAddress: string;
  let tokenContractAddress: string;
  let editionContractAddress: string;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(async () => {
    [adminWallet, samWallet, bobWallet] = signers;
    const simpleContractUri = await uploadContractMetadata(
      "test/abis/greeter.json",
    );
    const publisher = await sdk.getPublisher();
    customContractAddress = await publisher.deployContract(
      simpleContractUri,
      [],
      {
        name: "CustomContract",
      },
    );
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    nftContractAddress = await sdk.deployer.deployNFTCollection({
      name: `Drop`,
      description: "Test contract from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      primary_sale_recipient: samWallet.address,
      seller_fee_basis_points: 500,
      fee_recipient: bobWallet.address,
      platform_fee_basis_points: 10,
      platform_fee_recipient: adminWallet.address,
    });
    editionContractAddress = await sdk.deployer.deployEdition({
      name: `Edition`,
      description: "Test contract from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      primary_sale_recipient: samWallet.address,
      seller_fee_basis_points: 500,
      fee_recipient: bobWallet.address,
      platform_fee_basis_points: 10,
      platform_fee_recipient: adminWallet.address,
    });
    tokenContractAddress = await sdk.deployer.deployToken({
      name: `Token`,
      description: "Test contract from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      primary_sale_recipient: samWallet.address,
      platform_fee_basis_points: 10,
      platform_fee_recipient: adminWallet.address,
    });
  });

  it("should call raw ABI functions and read deployer address", async () => {
    const c = await sdk.getContract(customContractAddress);
    invariant(c, "Contract undefined");
    expect(await c.functions.decimals()).to.eq(18);
    const owner = await c.functions.owner();
    expect(owner).to.eq(adminWallet.address);
  });

  it("should fetch published metadata", async () => {
    const c = await sdk.getContract(customContractAddress);
    invariant(c, "Contract undefined");
    const meta = await c.publishedMetadata.get();
    expect(meta.name).to.eq("Greeter");
  });

  it("should extract functions", async () => {
    const c = await sdk.getContract(customContractAddress);
    invariant(c, "Contract undefined");
    const functions = await c.publishedMetadata.extractFunctions();
    expect(functions.length).gt(0);
  });

  it("should detect feature: metadata", async () => {
    const c = await sdk.getContract(customContractAddress);
    invariant(c, "Contract undefined");
    invariant(c.metadata, "Contract undefined");
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("CustomContract");
  });

  it("should detect feature: roles", async () => {
    const c = await sdk.getContractFromAbi(
      nftContractAddress,
      TokenERC721__factory.abi,
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
    const c = await sdk.getContractFromAbi(
      nftContractAddress,
      TokenERC721__factory.abi,
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
    const c = await sdk.getContractFromAbi(
      nftContractAddress,
      TokenERC721__factory.abi,
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
    const c = await sdk.getContractFromAbi(
      nftContractAddress,
      TokenERC721__factory.abi,
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
    const c = await sdk.getContractFromAbi("", VoteERC20__factory.abi);
    invariant(c, "Contract undefined");
    invariant(c.metadata, "Metadata undefined");
    expect(c.roles).to.eq(undefined);
  });

  it("should detect feature: erc20", async () => {
    const c = await sdk.getContractFromAbi(
      tokenContractAddress,
      TokenERC20__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.token, "ERC20 undefined");
    const token = await c.token.get();
    expect(token.name).to.eq("Token");
    expect(token.decimals).to.eq(18);
    invariant(c.token.mint, "ERC20Mintable undefined");
    await c.token.mint.to(adminWallet.address, 100);
    const balance = await c.token.balance();
    expect(balance.displayValue).to.eq("100.0");
    await c.token.transfer(samWallet.address, 25);
    expect((await c.token.balance()).displayValue).to.eq("75.0");
    expect((await c.token.balanceOf(samWallet.address)).displayValue).to.eq(
      "25.0",
    );
  });

  it("should detect feature: erc721", async () => {
    const c = await sdk.getContractFromAbi(
      nftContractAddress,
      TokenERC721__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.nft, "ERC721 undefined");
    invariant(c.nft.query, "ERC721 query undefined");
    invariant(c.nft.mint, "ERC721 minter undefined");
    await c.nft.mint.to(adminWallet.address, {
      name: "Custom NFT",
    });
    const nfts = await c.nft.query.all();
    expect(nfts.length).to.eq(1);
    expect(nfts[0].metadata.name).to.eq("Custom NFT");
  });

  it("should detect feature: erc1155", async () => {
    const c = await sdk.getContractFromAbi(
      editionContractAddress,
      TokenERC1155__factory.abi,
    );
    invariant(c, "Contract undefined");
    invariant(c.edition, "ERC1155 undefined");
    invariant(c.edition.query, "ERC1155 query undefined");
    invariant(c.edition.mint, "ERC1155 minter undefined");
    await c.edition.mint.to(adminWallet.address, {
      metadata: {
        name: "Custom NFT",
      },
      supply: 100,
    });
    const nfts = await c.edition.query.all();
    expect(nfts.length).to.eq(1);
    expect(nfts[0].metadata.name).to.eq("Custom NFT");
  });
});
