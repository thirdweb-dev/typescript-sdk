import {
  CurrencyTransferLib__factory,
  TWFactory__factory,
  TWFee__factory,
} from "@3rdweb/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ethers } from "ethers";
import { ethers as hardhatEthers } from "hardhat";
import {
  MarketplaceContract,
  CONTRACTS_MAP,
  PacksContract,
  ThirdwebSDK,
  TokenErc20Contract,
  VoteContract,
} from "../src";
import { MockStorage } from "./mock/MockStorage";
import { getNativeTokenByChainId } from "../src/common/currency";
import { ChainId } from "../src/constants/chains";
import { ChainlinkVrf } from "../src/constants/chainlink";

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const defaultProvider = hardhatEthers.provider;

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
  registryAddress = thirdwebFactoryDeployer.address;
  console.log("TWFactory address: ", thirdwebFactoryDeployer.address);
  console.log("TWRegistry address: ", thirdwebRegistryAddress);

  console.log("Creating the deployer deployment");
  const thirdwebFeeDeployer = await new ethers.ContractFactory(
    TWFee__factory.abi,
    TWFee__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress, thirdwebFactoryDeployer.address);
  console.log("Deploying the deployer");
  await thirdwebFactoryDeployer.deployed();

  console.log("TWFee address: ", thirdwebFeeDeployer.address);

  async function deployContract(
    contractFactory: ethers.ContractFactory,
    contractType: string,
  ): Promise<ethers.Contract> {
    switch (contractType) {
      case VoteContract.contractType:
      case TokenErc20Contract.contractType:
        return await contractFactory.deploy();
      case MarketplaceContract.contractType:
        const nativeTokenWrapperAddress = getNativeTokenByChainId(
          ChainId.Hardhat,
        ).wrapped.address;
        return await contractFactory.deploy(
          nativeTokenWrapperAddress,
          thirdwebFeeDeployer.address,
        );
      case PacksContract.contractType:
        const vrf = ChainlinkVrf[ChainId.Hardhat];
        return await contractFactory.deploy(
          vrf.vrfCoordinator,
          vrf.linkTokenAddress,
          thirdwebFeeDeployer.address,
        );
      default:
        return await contractFactory.deploy(thirdwebFeeDeployer.address);
    }
  }

  for (const contractType in CONTRACTS_MAP) {
    const contract = CONTRACTS_MAP[contractType];
    const factory = contract.contractFactory;

    const contractFactory = new ethers.ContractFactory(
      factory.abi,
      factory.bytecode,
    ).connect(signer);

    const deployedContract: ethers.Contract = await deployContract(
      contractFactory,
      contractType,
    );

    await deployedContract.deployed();

    const deployedContractType = await deployedContract.contractType();
    console.log(`Deployed contract ${contractType}`);
    const tx = await thirdwebFactoryDeployer.addImplementation(
      deployedContract.address,
    );
    console.log(
      `Setting deployed ${contractType} as an approved implementation at address: `,
      deployedContract.address,
    );
    await tx.wait();
  }

  process.env.registryAddress = thirdwebRegistryAddress;
  process.env.factoryAddress = thirdwebFactoryDeployer.address;

  const storage = new MockStorage();
  sdk = new ThirdwebSDK(
    signer,
    {
      gasSettings: {
        maxPriceInGwei: 10000,
      },
    },
    storage,
  );
});

export {
  ipfsGatewayUrl,
  sdk,
  signers,
  wrappedNativeTokenAddress,
  jsonProvider,
  defaultProvider,
  registryAddress,
  fastForwardTime,
};
