import { $enum } from "ts-enum-util";

/**
 * The type of Modules that are available.
 * @public
 */
export enum ModuleType {
  TOKEN = "TOKEN",
  BUNDLE = "BUNDLE",
  NFT = "NFT",
  PACK = "PACK",
  DROP = "DROP",
  SPLITS = "SPLITS",
  VOTE = "VOTE",
  BUNDLE_DROP = "BUNDLE_DROP",
  MARKETPLACE = "MARKETPLACE",
}
/**
 *
 * @param moduleName - a supported module name
 * @returns The {@link ModuleType} or undefined
 * @public
 */

export function convertNameToModuleType(
  moduleName?: string,
): ModuleType | undefined {
  return $enum(ModuleType).getValueOrDefault(
    moduleName?.toUpperCase(),
    undefined,
  );
}

/**
 *
 * @param moduleType - A {@link ModuleType}
 * @returns The name of the given {@link ModuleType} or undefined
 * @public
 */
export function convertModuleTypeToName(
  moduleType: ModuleType,
): keyof typeof ModuleType | undefined {
  return $enum(ModuleType).getKeyOrDefault(moduleType, undefined);
}
