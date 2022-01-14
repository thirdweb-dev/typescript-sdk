import { ethers, Wallet } from "ethers";
import { AppModule, BundleDropModule, ThirdwebSDK } from "../src";

const RPC_URL = "https://rpc-mumbai.maticvigil.com/";

global.fetch = require("node-fetch");

describe("Gasless Forwarder", async () => {
  let bundleDropModule: BundleDropModule;
  let appModule: AppModule;

  it.skip("should use sdk with biconomy", async () => {
    const BUNDLE_DROP_ADDRESS = "0xEBed8e37a32660dbCeeeC19cCBb952b7d214f008";
    const provider = ethers.getDefaultProvider(RPC_URL);
    const wallet = Wallet.createRandom().connect(provider);
    console.log("Testing with wallet: ", wallet.address);
    const sdk = new ThirdwebSDK(wallet, {
      gasless: {
        biconomy: {
          apiKey: process.env.BICONOMY_API_KEY,
          apiId: process.env.BICONOMY_API_ID,
        },
      },
    });
    const bundleDrop = sdk.getBundleDropModule(BUNDLE_DROP_ADDRESS);
    await bundleDrop.claim("0", 1, []);
  });

  it.skip("should use sdk with openzeppelin defender", async () => {
    const BUNDLE_DROP_ADDRESS = "0x41c1f16fAd38381727b327b26F282C7798ee0655";
    const provider = ethers.getDefaultProvider(RPC_URL);
    const wallet = Wallet.createRandom().connect(provider);
    console.log("Testing with wallet: ", wallet.address);
    const sdk = new ThirdwebSDK(wallet, {
      transactionRelayerUrl: process.env.OZ_DEFENDER_RELAYER_URL,
    });
    const bundleDrop = sdk.getBundleDropModule(BUNDLE_DROP_ADDRESS);
    await bundleDrop.claim("0", 1, []);
  });
});
