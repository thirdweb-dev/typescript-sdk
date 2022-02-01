import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { sdk, signers } from "./before.test";
import { TokenErc721Module } from "../src/modules/token-erc-721";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  let nftModule: TokenErc721Module;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.factory.deploy(TokenErc721Module.moduleType, {
      name: "NFT Module",
      description: "Test NFT module from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      seller_fee_basis_points: 1000,
      fee_recipient: AddressZero,
      platform_fee_basis_points: 10,
      platform_fee_recipient: AddressZero,
    });
    nftModule = sdk.getNFTModule(address);
  });

  it("should return nfts even if some are burned", async () => {
    await nftModule.mint({
      name: "Test1",
    });
    const token = await nftModule.mint({
      name: "Test2",
    });
    await nftModule.burn(token.id);
    const nfts = await nftModule.getAll();
    expect(nfts).to.be.an("array").length(2);
  });

  it("should fetch a single nft", async () => {
    await nftModule.mint({
      name: "Test1",
    });
    const nft = await nftModule.get("0");
    assert.isNotNull(nft);
    assert.equal(nft.metadata.name, "Test1");
  });

  it("should return an owner as zero address for an nft that is burned", async () => {
    const token = await nftModule.mint({
      name: "Test2",
    });
    await nftModule.burn(token.id);
    const nft = await nftModule.get("0");
    assert.equal(nft.owner, AddressZero);
  });

  it("should correctly mint nfts in batch", async () => {
    const metas = [
      {
        name: "Test1",
      },
      {
        name: "Test2",
      },
    ];
    const batch = await nftModule.mintBatch(metas);
    assert.lengthOf(batch, 2);

    for (const meta of metas) {
      const nft = batch.find(
        async (n) => (await n.data()).metadata.name === meta.name,
      );
      assert.isDefined(nft);
    }
  });

  it("should not be able to mint without permission", async () => {
    sdk.updateSignerOrProvider(samWallet);
    await expect(
      nftModule.mint({
        name: "Test2",
      }),
    ).to.throw;
  });

  // TODO signature based minting tests
});
