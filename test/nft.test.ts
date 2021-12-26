import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFTModule, ThirdwebSDK } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  let nftModule: NFTModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);

    nftModule = await appModule.deployNftModule({
      name: "NFT Module",
      sellerFeeBasisPoints: 1000,
    });
  });

  it("should return nfts even if some are burned", async () => {
    await nftModule.mint({
      name: "Test1",
    });
    const token = await nftModule.mint({
      name: "Test2",
    });
    await nftModule.burn(token.id);
    const nfts = await nftModule.getAllWithOwner();
    expect(nfts).to.be.an("array").length(2);
  });

  it("should fetch a single nft", async () => {
    await nftModule.mint({
      name: "Test1",
    });
    const nft = await nftModule.get("0");
    assert.isNotNull(nft);
    assert.equal(nft.name, "Test1");
  });

  it("should return an owner as zero address for an nft that is burned", async () => {
    const token = await nftModule.mint({
      name: "Test2",
    });
    await nftModule.burn(token.id);
    const nft = await nftModule.getWithOwner("0");
    assert.equal(nft.owner, AddressZero);
  });
  it("should correctly mint nfts in batch", async () => {
    console.log(await nftModule.getAllWithOwner());
    await nftModule.mintBatch([
      {
        name: "Test1",
      },
      {
        name: "Test2",
      },
    ]);
    const one = await nftModule.get("0");
    const two = await nftModule.get("1");
    expect(one.name).to.equal("Test1");
    expect(two.name).to.equal("Test2");
  });
});
