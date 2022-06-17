/**
 * @internal
 */
export type ChainOrRpc =
  | "mumbai"
  | "polygon"
  // common alias for `polygon`
  | "matic"
  | "rinkeby"
  | "goerli"
  | "mainnet"
  // common alias for `mainnet`
  | "ethereum"
  | "fantom"
  | "avalanche"
  | "optimism"
  | "optimism-testnet"
  | "arbitrum"
  | "arbitrum-testnet"
  | (string & {})
  | (number & {});
