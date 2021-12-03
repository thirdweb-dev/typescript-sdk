import { ethers } from "ethers";
import { CurrencyModule, ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Token Module", async () => {
  let sdk: ThirdwebSDK;
  let currencyModule: CurrencyModule;

  beforeEach(async () => {
    if (process.env.PKEY) {
      sdk = new ThirdwebSDK(
        new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
      );
    } else {
      sdk = new ThirdwebSDK(RPC_URL);
    }

    currencyModule = await sdk.getCurrencyModule(
      "0x4Cb16D7DAec6a7798efe19a43E8957E47A4bD272",
    );
  });

  it("should mint a batch of tokens to the correct wallets", async () => {
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
});
