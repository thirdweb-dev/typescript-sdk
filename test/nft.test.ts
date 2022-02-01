import { NFT, NFT__factory } from "@3rdweb/contracts";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "ethers";
import { NFTModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";
import hre, { ethers as hardhatEthers } from "hardhat";
import { TokenErc721Module } from "../src/modules/token-erc-721";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  let nftModule: TokenErc721Module;
  let oldNftModule: NFTModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    // sdk.setProviderOrSigner(adminWallet);
    //
    // nftModule = await appModule.deployNftModule({
    //   name: "NFT Module",
    //   sellerFeeBasisPoints: 1000,
    // });
    //
    // const tx = await new ethers.ContractFactory(
    //   NFT__factory.abi,
    //   NFT__factory.bytecode,
    // )
    //   .connect(adminWallet)
    //   .deploy(...[appModule.address, "NFT", "NFT", AddressZero, "", 0]);
    // await tx.deployed();
    //
    // oldNftModule = sdk.getNFTModule(tx.address);

    // NEW DEPLOY FLOW
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

    // TEMPROARY HACKS
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"],
    });
    await hre.network.provider.send("hardhat_setBalance", [
      "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
      ethers.utils.parseEther("10000000000000").toHexString(),
    ]);
    const fakeSigner = await hardhatEthers.getSigner(
      "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    );
    sdk.updateSignerOrProvider(fakeSigner);
    await nftModule.roles.grantRole("admin", adminWallet.address);
    await nftModule.roles.grantRole("minter", adminWallet.address);
    await nftModule.roles.grantRole("transfer", adminWallet.address);
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"],
    });
    sdk.updateSignerOrProvider(adminWallet);
    // END TEMPORARY HACKS
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
      const nft = batch.find((n) => n.name === meta.name);
      assert.isDefined(nft);
    }
  });
});
