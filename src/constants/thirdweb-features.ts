import IThirdwebPrimarySaleAbi from "../../abis/IPrimarySale.json";
import IThirdwebPlatformFeeAbi from "../../abis/IPlatformFee.json";
import IThirdwebRoyaltyAbi from "../../abis/IRoyalty.json";
import IPermissionsEnumerableAbi from "../../abis/IPermissionsEnumerable.json";

export const FEATURE_ROYALTY = {
  name: "Royalty",
  namespace: "sales",
  docLinks: {
    sdk: "sdk.contractroyalty",
    contracts: "IThirdwebPrimarySale",
  },
  abi: IThirdwebRoyaltyAbi,
  features: {},
} as const;

export const FEATURE_PRIMARY_SALE = {
  name: "PrimarySale",
  namespace: "sales",
  docLinks: {
    sdk: "sdk.contractprimarysale",
    contracts: "IThirdwebPrimarySale",
  },
  abi: IThirdwebPrimarySaleAbi,
  features: {},
} as const;

export const FEATURE_PLATFORM_FEE = {
  name: "PlatformFee",
  namespace: "platformFee",
  docLinks: {
    sdk: "sdk.platformfee",
    contracts: "IThirdwebPlatformFee",
  },
  abi: IThirdwebPlatformFeeAbi,
  features: {},
} as const;

export const FEATURE_PERMISSIONS = {
  name: "Permissions",
  namespace: "roles",
  docLinks: {
    sdk: "sdk.contractroles",
    contracts: "IPermissionsEnumerable",
  },
  abi: IPermissionsEnumerableAbi,
  features: {},
} as const;
