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
  abis: [IThirdwebRoyaltyAbi],
  features: {},
} as const;

export const FEATURE_PRIMARY_SALE = {
  name: "PrimarySale",
  namespace: "sales",
  docLinks: {
    sdk: "sdk.contractprimarysale",
    contracts: "IThirdwebPrimarySale",
  },
  abis: [IThirdwebPrimarySaleAbi],
  features: {},
} as const;

export const FEATURE_PLATFORM_FEE = {
  name: "PlatformFee",
  namespace: "platformFee",
  docLinks: {
    sdk: "sdk.platformfee",
    contracts: "IThirdwebPlatformFee",
  },
  abis: [IThirdwebPlatformFeeAbi],
  features: {},
} as const;

export const FEATURE_PERMISSIONS = {
  name: "Permissions",
  namespace: "roles",
  docLinks: {
    sdk: "sdk.contractroles",
    contracts: "IPermissionsEnumerable",
  },
  abis: [IPermissionsEnumerableAbi],
  features: {},
} as const;
