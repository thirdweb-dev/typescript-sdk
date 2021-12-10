import {
  ControlDeployer__factory,
  Forwarder__factory,
  Registry__factory,
} from "@3rdweb/contracts";
import { ethers, Signer } from "ethers";

export async function deployRegistry(signer: Signer): Promise<string> {
  // Deploy Forwarder
  const forwarder = await new ethers.ContractFactory(
    Forwarder__factory.abi,
    Forwarder__factory.bytecode,
  )
    .connect(signer)
    .deploy();

  await forwarder.deployed();
  const forwarderAddress = forwarder.address;

  // Deploy ControlDeployer
  const controlDeployer = await new ethers.ContractFactory(
    ControlDeployer__factory.abi,
    ControlDeployer__factory.bytecode,
  )
    .connect(signer)
    .deploy();

  await controlDeployer.deployed();
  const controlDeployerAddress = controlDeployer.address;

  const registry = await new ethers.ContractFactory(
    Registry__factory.abi,
    Registry__factory.bytecode,
  )
    .connect(signer)
    .deploy(
      await signer.getAddress(),
      forwarderAddress,
      controlDeployerAddress,
    );
  await registry.deployed();
  const registryAddress = registry.address;

  const registryRole = await controlDeployer.REGISTRY_ROLE();
  const tx = await controlDeployer.grantRole(registryRole, registryAddress);
  await tx.wait();
  console.log(`Granted Role to Registry on Deployer at tx hash: ${tx.hash}`);

  return registryAddress;
}
