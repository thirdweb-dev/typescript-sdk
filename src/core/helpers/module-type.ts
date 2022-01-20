import { IThirdwebModule__factory } from "@3rdweb/contracts";
import { Provider } from "@ethersproject/providers";
import { Signer } from "ethers";
import { ModuleType } from "../types";

/**
 * @internal
 *
 * @param moduleAddress - the address of the module to check for a valid module type
 * @throws if the module type cannot be determined
 * @returns the module type
 */
export async function getModuleTypeForAddress<TModuleType extends ModuleType>(
  moduleAddress: string,
  signerOrProvider: Signer | Provider,
): Promise<TModuleType> {
  const contract = IThirdwebModule__factory.connect(
    moduleAddress,
    signerOrProvider,
  );
  return (await contract.moduleType()) as TModuleType;
}
