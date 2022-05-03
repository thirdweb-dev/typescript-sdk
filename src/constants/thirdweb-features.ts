import IThirdwebPrimarySaleAbi from "../../abis/IThirdwebPrimarySale.json";
import IThirdwebPlatformFeeAbi from "../../abis/IThirdwebPlatformFee.json";
import IThirdwebRoyaltyAbi from "../../abis/IThirdwebRoyalty.json";

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
