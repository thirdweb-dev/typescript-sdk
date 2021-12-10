import { ethers } from "ethers";
import { CurrencyModule, ThirdwebSDK } from "../src/index";
import * as chai from "chai";

global.fetch = require("node-fetch");

const RPC_URL = "rinkeby";

describe("Token Module", async () => {
  let sdk: ThirdwebSDK;
  let currencyModule: CurrencyModule;

  beforeEach(async () => {
    if (process.env.PKEY) {
      sdk = new ThirdwebSDK(
        new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
        {
          ipfsGatewayUrl: "https://ipfs.io/ipfs/",
        },
      );
    } else {
      sdk = new ThirdwebSDK(RPC_URL, {
        ipfsGatewayUrl: "https://ipfs.io/ipfs/",
      });
    }

    currencyModule = sdk.getCurrencyModule(
      "0xea0b55CF85A41c03daeA88f99B7DdEb6e18DBE94",
    );
  });

  it.skip("should mint a batch of tokens to the correct wallets", async () => {
    const batch = [
      {
        address: "0x4d36d531D9cB40b8694763123D52170FAE5e1195",
        toMint: 10,
        currencyBalance: await currencyModule.balanceOf(
          "0x4d36d531D9cB40b8694763123D52170FAE5e1195",
        ),
      },
      {
        address: "0x99703159fbE079e1a48B53039a5e52e7b2d9E559",
        toMint: 10,
        currencyBalance: await currencyModule.balanceOf(
          "0x99703159fbE079e1a48B53039a5e52e7b2d9E559",
        ),
      },
    ];

    await currencyModule.mintBatchTo(
      batch.map((x) => {
        return {
          address: x.address,
          amount: x.toMint,
        };
      }),
    );

    batch.forEach(async (b) => {
      const newBalance = parseInt(
        (await currencyModule.balanceOf(b.address)).displayValue,
        10,
      );
      const expectedBalance =
        parseInt(b.currencyBalance.displayValue, 10) + b.toMint;

      chai.assert.equal(
        newBalance,
        expectedBalance,
        `Wallet balance should increase by ${b.toMint}`,
      );
    });
  });
  it("Should parse events properly", async () => {
    const balance = parseInt((await currencyModule.balance()).value);
    await currencyModule.mint(10);
    const totest = await currencyModule.getAll();
    chai.assert.equal(
      totest["0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803"].toNumber(),
      balance + 10,
    );
  });
});
