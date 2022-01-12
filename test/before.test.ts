import { WETH9__factory } from "@3rdweb/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { ethers as hardhatEthers } from "hardhat";
import { AppModule, ThirdwebSDK } from "../src";
import { deployRegistry } from "./setup/deployRegistry";

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const defaultProvider = hardhatEthers.provider;

let appModule: AppModule;
let registryAddress: string;
let sdk: ThirdwebSDK;
const ipfsGatewayUrl = "https://ipfs.thirdweb.com/ipfs/";
let signer: SignerWithAddress;
let signers: SignerWithAddress[];

let wrappedNativeTokenAddress: string;

const fastForwardTime = async (timeInSeconds: number): Promise<void> => {
  const now = Math.floor(Date.now() / 1000);
  await defaultProvider.send("evm_mine", [now + timeInSeconds]);
};

before(async () => {
  signers = await hardhatEthers.getSigners();
  [signer] = signers;

  const wTokenDeployer = await new ethers.ContractFactory(
    WETH9__factory.abi,
    WETH9__factory.bytecode,
  )
    .connect(signer)
    .deploy();

  await wTokenDeployer.deployed();
  wrappedNativeTokenAddress = wTokenDeployer.address;
  console.log(wrappedNativeTokenAddress);

  await jsonProvider.send("hardhat_reset", []);
  registryAddress = await deployRegistry(signer);
  console.log("Deployed registry at address: ", registryAddress);

  sdk = new ThirdwebSDK(signer, {
    ipfsGatewayUrl,
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

export {
  ipfsGatewayUrl,
  appModule,
  sdk,
  signers,
  wrappedNativeTokenAddress,
  jsonProvider,
  defaultProvider,
  fastForwardTime,
};
