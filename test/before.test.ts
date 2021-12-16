import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { AppModule, ThirdwebSDK } from "../src";
import { deployRegistry } from "./setup/deployRegistry";
import { ethers as hardhatEthers } from "hardhat";
import { WETH9__factory } from "@3rdweb/contracts";

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);

let appModule: AppModule;
let registryAddress: string;
let sdk: ThirdwebSDK;
let signer: SignerWithAddress;
let signers: SignerWithAddress[];

let wrappedNativeTokenAddress: string;

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

  jsonProvider.send("hardhat_reset", []);
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

export { appModule, sdk, signers, wrappedNativeTokenAddress };
