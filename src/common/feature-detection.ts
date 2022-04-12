import { BaseContract } from "ethers";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { Interface } from "@ethersproject/abi";
import { IStorage } from "../core";
import {
  AbiSchema,
  CustomContractMetadataSchema,
} from "../schema/contracts/custom";
import { z } from "zod";

/**
 * Type guards a contract to a known type if it matches the corresponding interface
 * @internal
 * @param contractWrapper
 * @param interfaceToMatch
 */
export function implementsInterface<C extends BaseContract>(
  contractWrapper: ContractWrapper<BaseContract>,
  interfaceToMatch: Interface,
): contractWrapper is ContractWrapper<C> {
  return matchesInterface(contractWrapper.readContract, interfaceToMatch);
}

/**
 * Checks the intersection of the 'functions' objects of a given contract and interface
 * @internal
 * @param contract
 * @param interfaceToMatch
 */
function matchesInterface(contract: BaseContract, interfaceToMatch: Interface) {
  // returns true if all the functions in `interfaceToMatch` are found in `contract`
  const contractFn = contract.interface.functions;
  const interfaceFn = interfaceToMatch.functions;
  return (
    Object.keys(contractFn).filter((k) => k in interfaceFn).length ===
    Object.keys(interfaceFn).length
  );
}

/**
 * @internal
 */
export async function extractConstructorParams(
  metadataUri: string,
  storage: IStorage,
) {
  const metadata = CustomContractMetadataSchema.parse(
    await storage.get(metadataUri),
  );
  const abiRaw = await storage.get(metadata.abiUri);
  const abi = AbiSchema.parse(abiRaw);
  return extractConstructorParamsFromAbi(abi);
}

/**
 *
 * @param abi
 * @returns
 * @internal
 */
export function extractConstructorParamsFromAbi(
  abi: z.input<typeof AbiSchema>,
) {
  for (const input of abi) {
    if (input.type === "constructor") {
      return input.inputs ?? [];
    }
  }
  return [];
}

/**
 * @internal
 * @param metadataUri
 * @param storage
 */
export async function fetchContractMetadata(
  metadataUri: string,
  storage: IStorage,
) {
  const metadata = CustomContractMetadataSchema.parse(
    await storage.get(metadataUri),
  );
  const abi = AbiSchema.parse(await storage.get(metadata.abiUri));
  const bytecode = await storage.getRaw(metadata.bytecodeUri);
  return {
    name: metadata.name,
    abi,
    bytecode,
  };
}
