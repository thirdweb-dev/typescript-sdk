import { ethers } from "ethers";
import { ThirdwebSDK } from "../src/index";
import { deployRegistry } from "./setup/deployRegistry";

global.fetch = require("node-fetch");

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const provider = ethers.getDefaultProvider(RPC_URL);

let registryAddress: string;
let sdk: ThirdwebSDK;

before(async () => {
  jsonProvider.send("hardhat_reset", []);

  const signer = new ethers.Wallet(process.env.PKEY, provider);
  registryAddress = await deployRegistry(signer);
  console.log("Deployed registry at address: ", registryAddress);

  sdk = new ThirdwebSDK(signer, {
    ipfsGatewayUrl: "https://ipfs.io/ipfs/",
    registryContractAddress: registryAddress,
    maxGasPriceInGwei: 10000,
  });
});

describe("App Two Module", async () => {
  it("should be able to deploy a module", async () => {
    const appModule = await sdk.createApp({
      name: "test",
    });
    const x = 0;
  });
});
