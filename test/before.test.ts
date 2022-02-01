import {
  CurrencyTransferLib__factory,
  DropERC721__factory,
  TWFactory__factory,
  TWFee__factory,
} from "@3rdweb/contracts";
import { DropERC721LibraryAddresses } from "@3rdweb/contracts/dist/factories/DropERC721__factory";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ethers } from "ethers";
import { ethers as hardhatEthers } from "hardhat";
import { MODULES_MAP, ThirdwebSDK } from "../src";
import { MockStorage } from "./mock/MockStorage";

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const defaultProvider = hardhatEthers.provider;

let appModule: any;
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

  const trustedForwarderAddress = "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";
  const defaultRoyaltyFeeBps = BigNumber.from(100);
  const defaultTransactionFeeBps = BigNumber.from(50);
  const defaultRecipient = signer.address;

  // const wTokenDeployer = await new ethers.ContractFactory(
  //   WETH9__factory.abi,
  //   WETH9__factory.bytecode,
  // )
  //   .connect(signer)
  //   .deploy();
  // await wTokenDeployer.deployed();
  // wrappedNativeTokenAddress = wTokenDeployer.address;
  // console.log(wrappedNativeTokenAddress);

  await jsonProvider.send("hardhat_reset", []);

  const currencyTransferDeployer = await new ethers.ContractFactory(
    CurrencyTransferLib__factory.abi,
    CurrencyTransferLib__factory.bytecode,
  )
    .connect(signer)
    .deploy();
  await currencyTransferDeployer.deployed();
  const currencyTransferAddress = currencyTransferDeployer.address;
  console.log("currencyTransferAddress", currencyTransferAddress);

  const thirdwebFactoryDeployer = await new ethers.ContractFactory(
    TWFactory__factory.abi,
    TWFactory__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress);
  const deployTxFactory = thirdwebFactoryDeployer.deployTransaction;
  console.log(
    "Deploying TWFactory and TWRegistry at tx: ",
    deployTxFactory.hash,
  );
  await deployTxFactory.wait();
  const thirdwebRegistryAddress = await thirdwebFactoryDeployer.registry();

  console.log("TWFactory address: ", thirdwebFactoryDeployer.address);
  console.log("TWRegistry address: ", thirdwebRegistryAddress);

  console.log("Creating the deployer deployment");
  const thirdwebFeeDeployer = await new ethers.ContractFactory(
    TWFee__factory.abi,
    TWFee__factory.bytecode,
  )
    .connect(signer)
    .deploy(
      trustedForwarderAddress,
      defaultRecipient,
      defaultRecipient,
      defaultRoyaltyFeeBps,
      defaultTransactionFeeBps,
    );
  console.log("Deploying the deployer");
  await thirdwebFactoryDeployer.deployed();
  // const deployTxFee = thirdwebFeeDeployer.deployTransaction;
  // console.log("Deploying TWFee at tx: ", deployTxFee.hash);
  // await deployTxFee.wait();

  console.log("TWFee address: ", thirdwebFeeDeployer.address);

  for (const moduleType in MODULES_MAP) {
    const module = MODULES_MAP[moduleType];
    const contractFactory = module.contractFactory;

    const moduleFactory = await new ethers.ContractFactory(
      contractFactory.abi,
      contractFactory.linkBytecode({
        "contracts/lib/CurrencyTransferLib.sol:CurrencyTransferLib":
          currencyTransferAddress,
      }),
    )
      .connect(signer)
      .deploy(thirdwebFeeDeployer.address);
    console.log(
      `Deploying Module ${moduleType} at tx:`,
      moduleFactory.deployTransaction.hash,
    );
    await moduleFactory.deployed();
    // await drop721Factory.deployTransaction.wait();

    const deployedModuleType = await moduleFactory.moduleType();
    console.log(`Deployed module ${moduleType}: `, deployedModuleType);
    const tx = await thirdwebFactoryDeployer.addModuleImplementation(
      deployedModuleType,
      moduleFactory.address,
    );
    console.log(
      `Setting deployed ${moduleType} as an approved implementation at tx: `,
      tx.hash,
    );
    await tx.wait();
  }

  const storage = new MockStorage();
  sdk = new ThirdwebSDK(
    signer,
    {
      gasSettings: {
        maxPriceInGwei: 10000,
      },
      thirdwebModuleFactory: thirdwebFactoryDeployer.address,
    },
    storage,
  );
});

export {
  ipfsGatewayUrl,
  appModule,
  sdk,
  signers,
  wrappedNativeTokenAddress,
  jsonProvider,
  defaultProvider,
  registryAddress,
  fastForwardTime,
};
