import {
  TWFactory,
  TWFactory__factory,
  TWFee__factory,
  TWRegistry,
  TWRegistry__factory,
} from "@thirdweb-dev/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { ethers as hardhatEthers } from "hardhat";
import {
  CONTRACTS_MAP,
  ContractType,
  getNativeTokenByChainId,
  IStorage,
  Marketplace,
  Pack,
  ThirdwebSDK,
  Vote,
} from "../src";
import { MockStorage } from "./mock/MockStorage";
import { ChainId } from "../src/constants/chains";
import { ChainlinkVrf } from "../src/constants/chainlink";

const RPC_URL = "http://localhost:8545";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const defaultProvider = hardhatEthers.provider;

let registryAddress: string;
let sdk: ThirdwebSDK;
const ipfsGatewayUrl = "https://thirdweb-ipfs-api.zeet-nftlabs.zeet.app/ipfs/";
let signer: SignerWithAddress;
let signers: SignerWithAddress[];
let storage: IStorage;

let wrappedNativeTokenAddress: string;

const fastForwardTime = async (timeInSeconds: number): Promise<void> => {
  const now = Math.floor(Date.now() / 1000);
  await defaultProvider.send("evm_mine", [now + timeInSeconds]);
};

export const expectError = (e: unknown, message: string) => {
  if (e instanceof Error) {
    if (!e.message.includes(message)) {
      throw e;
    }
  } else {
    throw e;
  }
};

before(async () => {
  signers = await hardhatEthers.getSigners();
  [signer] = signers;

  const trustedForwarderAddress = "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";
  await jsonProvider.send("hardhat_reset", []);

  const registry = (await new ethers.ContractFactory(
    TWRegistry__factory.abi,
    TWRegistry__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress)) as TWRegistry;
  const registryContract = await registry.deployed();
  console.log("TWRegistry address: ", registry.address);

  const thirdwebFactoryDeployer = (await new ethers.ContractFactory(
    TWFactory__factory.abi,
    TWFactory__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress, registry.address)) as TWFactory;

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

  await registryContract.grantRole(
    await registryContract.OPERATOR_ROLE(),
    thirdwebFactoryDeployer.address,
  );

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
    contractType: ContractType,
  ): Promise<ethers.Contract> {
    switch (contractType) {
      case Vote.contractType:
        return await contractFactory.deploy();
      case Marketplace.contractType:
        const nativeTokenWrapperAddress = getNativeTokenByChainId(
          ChainId.Hardhat,
        ).wrapped.address;
        return await contractFactory.deploy(
          nativeTokenWrapperAddress,
          thirdwebFeeDeployer.address,
        );
      case Pack.contractType:
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
    const contract = CONTRACTS_MAP[contractType as ContractType];
    const factory = contract.contractFactory;

    const contractFactory = new ethers.ContractFactory(
      factory.abi,
      factory.bytecode,
    ).connect(signer);

    const deployedContract: ethers.Contract = await deployContract(
      contractFactory,
      contractType as ContractType,
    );

    await deployedContract.deployed();

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

  storage = new MockStorage();
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
  storage,
};
