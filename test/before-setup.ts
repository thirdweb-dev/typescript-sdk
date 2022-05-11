import {
  ByocFactory,
  ByocFactory__factory,
  ByocRegistry,
  ByocRegistry__factory,
  DropERC1155__factory,
  DropERC20__factory,
  DropERC721__factory,
  Marketplace__factory,
  Pack__factory,
  Split__factory,
  TokenERC1155__factory,
  TokenERC20__factory,
  TokenERC721__factory,
  TWFactory,
  TWFactory__factory,
  TWFee__factory,
  TWRegistry,
  TWRegistry__factory,
  VoteERC20__factory,
} from "contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { ethers as hardhatEthers } from "hardhat";
import {
  CONTRACTS_MAP,
  ContractType,
  DEFAULT_IPFS_GATEWAY,
  Edition,
  EditionDrop,
  getNativeTokenByChainId,
  IStorage,
  Marketplace,
  NFTCollection,
  NFTDrop,
  Pack,
  Split,
  ThirdwebSDK,
  Token,
  TokenDrop,
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
const ipfsGatewayUrl = DEFAULT_IPFS_GATEWAY;
let signer: SignerWithAddress;
let signers: SignerWithAddress[];
let storage: IStorage;

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

  const thirdwebFactoryDeployer = (await new ethers.ContractFactory(
    TWFactory__factory.abi,
    TWFactory__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress, registry.address)) as TWFactory;

  const deployTxFactory = thirdwebFactoryDeployer.deployTransaction;
  await deployTxFactory.wait();
  const thirdwebRegistryAddress = await thirdwebFactoryDeployer.registry();
  registryAddress = thirdwebFactoryDeployer.address;

  await registryContract.grantRole(
    await registryContract.OPERATOR_ROLE(),
    thirdwebFactoryDeployer.address,
  );

  const thirdwebFeeDeployer = await new ethers.ContractFactory(
    TWFee__factory.abi,
    TWFee__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress, thirdwebFactoryDeployer.address);
  await thirdwebFactoryDeployer.deployed();

  const customFactoryDeployer = (await new ethers.ContractFactory(
    ByocFactory__factory.abi,
    ByocFactory__factory.bytecode,
  )
    .connect(signer)
    .deploy(registry.address, trustedForwarderAddress)) as ByocFactory;
  await customFactoryDeployer.deployed();

  const customRegistryDeployer = (await new ethers.ContractFactory(
    ByocRegistry__factory.abi,
    ByocRegistry__factory.bytecode,
  )
    .connect(signer)
    .deploy(trustedForwarderAddress)) as ByocRegistry;
  await customRegistryDeployer.deployed();

  await registryContract.grantRole(
    await registryContract.OPERATOR_ROLE(),
    customFactoryDeployer.address,
  );

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
    if (contractType === "custom") {
      continue;
    }
    let factory;
    switch (contractType) {
      case Token.contractType:
        factory = TokenERC20__factory;
        break;
      case TokenDrop.contractType:
        factory = DropERC20__factory;
        break;
      case NFTCollection.contractType:
        factory = TokenERC721__factory;
        break;
      case NFTDrop.contractType:
        factory = DropERC721__factory;
        break;
      case Edition.contractType:
        factory = TokenERC1155__factory;
        break;
      case EditionDrop.contractType:
        factory = DropERC1155__factory;
        break;
      case Split.contractType:
        factory = Split__factory;
        break;
      case Vote.contractType:
        factory = VoteERC20__factory;
        break;
      case Marketplace.contractType:
        factory = Marketplace__factory;
        break;
      case Pack.contractType:
        factory = Pack__factory;
        break;
      default:
        throw new Error(`No factory for contract: ${contractType}`);
    }

    const contractFactory = new ethers.ContractFactory(
      factory.abi,
      factory.bytecode,
    ).connect(signer);

    const deployedContract: ethers.Contract = await deployContract(
      contractFactory,
      contractType as ContractType,
    );

    await deployedContract.deployed();
    const tx = await thirdwebFactoryDeployer.addImplementation(
      deployedContract.address,
    );
    await tx.wait();
  }

  process.env.registryAddress = thirdwebRegistryAddress;
  process.env.factoryAddress = thirdwebFactoryDeployer.address;
  process.env.byocRegistryAddress = customRegistryDeployer.address;
  process.env.byocFactoryAddress = customFactoryDeployer.address;

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
  jsonProvider,
  defaultProvider,
  registryAddress,
  fastForwardTime,
  storage,
};
