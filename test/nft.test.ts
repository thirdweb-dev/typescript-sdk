import { NFT, NFT__factory } from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "ethers";
import { NFTModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  let nftModule: NFTModule;
  let oldNftModule: NFTModule;

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

    const tx = await new ethers.ContractFactory(
      NFT__factory.abi,
      NFT__factory.bytecode,
    )
      .connect(adminWallet)
      .deploy(...[appModule.address, "NFT", "NFT", AddressZero, "", 0]);
    await tx.deployed();

    oldNftModule = sdk.getNFTModule(tx.address);
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
      const nft = batch.find((n) => n.name === meta.name);
      assert.isDefined(nft);
    }
  });

  describe("Old Module Backwards Compatibility", () => {
    it("should perform a mint successfully", async () => {
      const nft = await oldNftModule.mint({
        name: "test",
      });
      console.log(nft);
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
      const batch = await oldNftModule.mintBatch(metas);
      assert.lengthOf(batch, 2);

      for (const meta of metas) {
        const nft = batch.find((n) => n.name === meta.name);
        assert.isDefined(nft);
      }
    });
  });
});
