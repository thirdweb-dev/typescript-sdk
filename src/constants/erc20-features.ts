import ERC20Abi from "../../abis/ERC20.json";

export const FEATURE_TOKEN = {
  name: "ERC20",
  namespace: "token",
  docLinks: {
    sdk: "sdk.erc20",
    contracts: "ERC20",
  },
  abi: ERC20Abi,
  features: {},
} as const;
