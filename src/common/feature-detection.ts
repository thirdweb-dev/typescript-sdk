import { BaseContract, utils } from "ethers";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { IStorage } from "../core";
import {
  AbiFunction,
  AbiSchema,
  CustomContractMetadataSchema,
  PublishedMetadata,
} from "../schema/contracts/custom";
import { z } from "zod";
import {
  Feature,
  FeatureName,
  FeatureWithEnabled,
  SUPPORTED_FEATURES,
} from "../constants/contract-features";

/**
 * Type guards a contract to a known type if it matches the corresponding interface
 * @internal
 * @param contractWrapper
 * @param interfaceToMatch
 */
export function implementsInterface<C extends BaseContract>(
  contractWrapper: ContractWrapper<BaseContract>,
  interfaceToMatch: utils.Interface,
): contractWrapper is ContractWrapper<C> {
  return matchesInterface(contractWrapper.readContract, interfaceToMatch);
}

/**
 * Checks the intersection of the 'functions' objects of a given contract and interface
 * @internal
 * @param contract
 * @param interfaceToMatch
 */
function matchesInterface(
  contract: BaseContract,
  interfaceToMatch: utils.Interface,
) {
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
 * @param abi
 * @param interfaceAbis
 */
function matchesAbiInterface(
  abi: z.input<typeof AbiSchema>,
  interfaceAbis: readonly z.input<typeof AbiSchema>[],
): boolean {
  // returns true if all the functions in `interfaceToMatch` are found in `contract`
  const contractFn = extractFunctionsFromAbi(abi).map((f) => f.name);
  const interfaceFn = interfaceAbis
    .flatMap((i) => extractFunctionsFromAbi(i))
    .map((f) => f.name);
  return (
    contractFn.filter((k) => interfaceFn.includes(k)).length ===
    interfaceFn.length
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
 * @internal
 * @param metadataUri
 * @param storage
 */
export async function extractFunctions(
  metadataUri: string,
  storage: IStorage,
): Promise<AbiFunction[]> {
  const metadata = CustomContractMetadataSchema.parse(
    await storage.get(metadataUri),
  );
  const abiRaw = await storage.get(metadata.abiUri);
  const abi = AbiSchema.parse(abiRaw);
  return extractFunctionsFromAbi(abi);
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
 * @param abi
 */
export function extractFunctionsFromAbi(
  abi: z.input<typeof AbiSchema>,
): AbiFunction[] {
  const functions = abi.filter((el) => el.type === "function");
  const parsed = [];
  for (const f of functions) {
    const args =
      f.inputs?.map((i) => `${i.name}: ${toJSType(i.type)}`)?.join(", ") || "";
    const out = f.outputs?.map((o) => toJSType(o.type, true))?.join(", ");
    const promise = out ? `: Promise<${out}>` : "";
    const signature = `${f.name}(${args})${promise}`;
    parsed.push({
      inputs: f.inputs ?? [],
      outputs: f.outputs ?? [],
      name: f.name ?? "unknown",
      signature,
    });
  }
  return parsed;
}

function toJSType(contractType: string, isReturnType = false): string {
  if (contractType.startsWith("bytes")) {
    return "BytesLike";
  }
  if (contractType.startsWith("uint") || contractType.startsWith("int")) {
    return isReturnType ? "BigNumber" : "BigNumberish";
  }
  if (contractType === "bool") {
    return "boolean";
  }
  if (contractType === "address") {
    return "string";
  }
  return contractType;
}

/**
 * @internal
 * @param metadataUri
 * @param storage
 */
export async function fetchContractMetadata(
  metadataUri: string,
  storage: IStorage,
): Promise<PublishedMetadata> {
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

/**
 * Processes ALL supported features and sets whether the passed in abi supports each individual feature
 * @internal
 * @param abi
 * @param features
 * @returns the nested struct of all features and whether they're detected in the abi
 */
export function detectFeatures(
  abi: z.input<typeof AbiSchema>,
  features: Record<string, Feature> = SUPPORTED_FEATURES,
): Record<string, FeatureWithEnabled> {
  const results: Record<string, FeatureWithEnabled> = {};
  for (const featureKey in features) {
    const feature = features[featureKey];
    const enabled = matchesAbiInterface(abi, feature.abis);
    const childResults = detectFeatures(abi, feature.features);
    results[featureKey] = {
      ...feature,
      features: childResults,
      enabled,
    } as FeatureWithEnabled;
  }
  return results;
}

/**
 * Checks whether the given ABI supports a given feature
 * @internal
 * @param abi
 * @param featureName
 */
export function isFeatureEnabled(
  abi: z.input<typeof AbiSchema>,
  featureName: FeatureName,
): boolean {
  const features = detectFeatures(abi);
  return _featureEnabled(features, featureName);
}

/**
 * Type guard for contractWrappers depending on passed feature name
 * @internal
 * @param contractWrapper
 * @param featureName
 */
export function detectContractFeature<T extends BaseContract>(
  contractWrapper: ContractWrapper<BaseContract>,
  featureName: FeatureName,
): contractWrapper is ContractWrapper<T> {
  return isFeatureEnabled(AbiSchema.parse(contractWrapper.abi), featureName);
}

/**
 * Searches the feature map for featureName and returns whether its enabled
 * @internal
 * @param features
 * @param featureName
 */
function _featureEnabled(
  features: Record<string, FeatureWithEnabled>,
  featureName: FeatureName,
): boolean {
  const keys = Object.keys(features);
  if (!keys.includes(featureName)) {
    let found = false;
    for (const key of keys) {
      const f = features[key];
      found = _featureEnabled(
        f.features as Record<string, FeatureWithEnabled>,
        featureName,
      );
      if (found) {
        break;
      }
    }
    return found;
  }
  const feature = features[featureName];
  return feature.enabled;
}
