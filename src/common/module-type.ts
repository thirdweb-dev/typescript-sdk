/**
 * The type of Modules that are available.
 * @public
 */
export enum ModuleType {
  Currency = 0,
  Collection = 1,
  NFT = 2,
  DynamicNFT = 3,
  AccessNFT = 4,
  Pack = 5,
  Market = 6,
  Other = 7,
}
/**
 *
 * @param moduleName - a supported module name
 * @returns The {@link ModuleType}
 * @public
 */

export function convertNameToModuleType(
  moduleName: keyof typeof ModuleType,
): ModuleType {
  return ModuleType[moduleName];
}

/**
 *
 * @param moduleType - A {@link ModuleType}
 * @returns The name of the given {@link ModuleType}
 * @public
 */
export function convertModuleTypeToName(
  moduleType: ModuleType,
): keyof typeof ModuleType | undefined {
  return (Object.keys(ModuleType) as (keyof typeof ModuleType)[]).find(
    (key) => ModuleType[key] === moduleType,
  );
}
