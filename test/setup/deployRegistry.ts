import { Registry__factory } from "@3rdweb/contracts";
import { ethers, Signer } from "ethers";

export async function deployRegistry(signer: Signer): Promise<string> {
  const tx = await new ethers.ContractFactory(
    Registry__factory.abi,
    Registry__factory.bytecode,
  )
    .connect(signer)
    .deploy(
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    );
  await tx.deployed();
  const contractAddress = tx.address;
  return contractAddress;
}
