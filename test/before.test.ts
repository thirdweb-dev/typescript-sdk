import { ethers } from "ethers";
import { AppModule, ThirdwebSDK } from "../src";
import { deployRegistry } from "./setup/deployRegistry";

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const provider = ethers.getDefaultProvider(RPC_URL);

let appModule: AppModule;
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

  const receipt = await sdk.createApp({
    name: "test",
  });
  const event = receipt?.events?.find(
    (e: any) => e.event === "NewProtocolControl",
  );
  const address = event?.args?.controlAddress as string;
  console.log("Created app at address: ", address);
  appModule = await sdk.getAppModule(address);
});

export { appModule, sdk };
