import { assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenErc20Module } from "../src";
import { sdk, signers } from "./before.test";
import { BigNumber, ethers } from "ethers";
import { TokenMintInput } from "../src/schema/tokens/token";

// global.fetch = require("node-fetch");

describe("Token Module", async () => {
  let currencyModule: TokenErc20Module;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.factory.deploy(TokenErc20Module.moduleType, {
      name: `Testing token from SDK`,
      symbol: `TEST`,
      description: "Test module from tests",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
    });
    currencyModule = sdk.getTokenModule(address);
  });

  it("should mint tokens", async () => {
    await currencyModule.mint(ethers.utils.parseEther("20"));
    assert.deepEqual(
      await currencyModule.totalSupply(),
      ethers.utils.parseEther("20"),
      `Wrong supply`,
    );
    assert.deepEqual(
      (await currencyModule.balanceOf(adminWallet.address)).value,
      ethers.utils.parseEther("20"),
      `Wrong balance`,
    );
  });

  it("should transfer tokens", async () => {
    await currencyModule.mint(ethers.utils.parseEther("20"));
    await currencyModule.transfer(
      samWallet.address,
      ethers.utils.parseEther("10"),
    );
    assert.deepEqual(
      (await currencyModule.balanceOf(adminWallet.address)).value,
      ethers.utils.parseEther("10"),
      `Wrong balance`,
    );
    assert.deepEqual(
      (await currencyModule.balanceOf(samWallet.address)).value,
      ethers.utils.parseEther("10"),
      `Wrong balance`,
    );
  });

  it("should mint a batch of tokens to the correct wallets", async () => {
    const batch: TokenMintInput[] = [
      {
        toAddress: bobWallet.address,
        amount: 10,
      },
      {
        toAddress: samWallet.address,
        amount: 10,
      },
    ];

    await currencyModule.mintBatchTo(batch);

    for (const b of batch) {
      const expectedBalance = BigNumber.from(10);
      const actualBalance = (await currencyModule.balanceOf(b.toAddress)).value;

      assert.deepEqual(
        actualBalance,
        expectedBalance,
        `Wallet balance should increase by ${b.amount}`,
      );
    }
  });

  it("should transfer a batch of tokens to the correct wallets", async () => {
    const batch: TokenMintInput[] = [
      {
        toAddress: bobWallet.address,
        amount: 10,
      },
      {
        toAddress: samWallet.address,
        amount: 10,
      },
    ];
    await currencyModule.mint(20);
    await currencyModule.transferBatch(batch);

    for (const b of batch) {
      const expectedBalance = BigNumber.from(10);
      const actualBalance = (await currencyModule.balanceOf(b.toAddress)).value;

      assert.deepEqual(
        actualBalance,
        expectedBalance,
        `Wallet balance should increase by ${b.amount}`,
      );
    }
  });
});
