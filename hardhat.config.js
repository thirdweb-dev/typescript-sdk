// Do not modify the existing settings
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.SDK_ALCHEMY_KEY}`,
      },
      chainId: 1,
      initialBaseFeePerGas: 0, // Allow 0 gas fees when testing
      throwOnTransactionFailures: true, // Brownie expects transactions to throw on revert
      throwOnCallFailures: true, // Brownie expects calls to throw on failure
    },
  },
};
