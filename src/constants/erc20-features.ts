import ERC20Abi from "../../abis/IERC20.json";
import IMintableERC20Abi from "../../abis/IMintableERC20.json";
import MulticallAbi from "../../abis/IMulticall.json";

export const FEATURE_TOKEN_BATCH_MINTABLE = {
  name: "ERC20BatchMintable",
  namespace: "token.mint.batch",
  docLinks: {
    sdk: "sdk.erc20batchmintable",
    contracts: "IMulticall",
  },
  abis: [ERC20Abi, IMintableERC20Abi, MulticallAbi],
  features: {},
} as const;

export const FEATURE_TOKEN_MINTABLE = {
  name: "ERC20Mintable",
  namespace: "token.mint",
  docLinks: {
    sdk: "sdk.erc20mintable",
    contracts: "IMintableERC20",
  },
  abis: [ERC20Abi, IMintableERC20Abi],
  features: {
    [FEATURE_TOKEN_BATCH_MINTABLE.name]: FEATURE_TOKEN_BATCH_MINTABLE,
  },
} as const;

export const FEATURE_TOKEN = {
  name: "ERC20",
  namespace: "token",
  docLinks: {
    sdk: "sdk.erc20",
    contracts: "IERC20",
  },
  abis: [ERC20Abi],
  features: {
    [FEATURE_TOKEN_MINTABLE.name]: FEATURE_TOKEN_MINTABLE,
  },
} as const;
