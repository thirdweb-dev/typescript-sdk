import IThirdwebPrimarySaleAbi from "../../abis/IPrimarySale.json";
import IThirdwebPlatformFeeAbi from "../../abis/IPlatformFee.json";
import IThirdwebRoyaltyAbi from "../../abis/IRoyalty.json";
import IPermissionsEnumerableAbi from "../../abis/IPermissionsEnumerable.json";
import IContractMetadataAbi from "../../abis/IContractMetadata.json";
import IAppUriAbi from "../../abis/IAppURI.json";

export const FEATURE_ROYALTY = {
  name: "Royalty",
  namespace: "royalty",
  docLinks: {
    sdk: "sdk.contractroyalty",
    contracts: "Royalty",
  },
  abis: [IThirdwebRoyaltyAbi],
  features: {},
} as const;

export const FEATURE_PRIMARY_SALE = {
  name: "PrimarySale",
  namespace: "sales",
  docLinks: {
    sdk: "sdk.contractprimarysale",
    contracts: "PrimarySale",
  },
  abis: [IThirdwebPrimarySaleAbi],
  features: {},
} as const;

export const FEATURE_PLATFORM_FEE = {
  name: "PlatformFee",
  namespace: "platformFee",
  docLinks: {
    sdk: "sdk.platformfee",
    contracts: "PlatformFee",
  },
  abis: [IThirdwebPlatformFeeAbi],
  features: {},
} as const;

export const FEATURE_PERMISSIONS = {
  name: "Permissions",
  namespace: "roles",
  docLinks: {
    sdk: "sdk.contractroles",
    contracts: "PermissionsEnumerable",
  },
  abis: [IPermissionsEnumerableAbi],
  features: {},
} as const;

export const FEATURE_METADATA = {
  name: "ContractMetadata",
  namespace: "metadata",
  docLinks: {
    sdk: "sdk.contractmetadata",
    contracts: "ContractMetadata",
  },
  abis: [IContractMetadataAbi],
  features: {},
} as const;

export const FEATURE_APP_URI = {
  name: "AppURI",
  namespace: "appUri",
  docLinks: {
    sdk: "sdk.appuri",
    contracts: "AppUri",
  },
  abis: [IAppUriAbi],
  features: {},
} as const;
