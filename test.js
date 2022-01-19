const contributors = [
    {
      "address":"0x2517E8E8Dd5400860c4db8D5D3907bc85B41D23C",
      "amount":ethers.utils.parseUnits("3" + ("0" * 15))
      },
    {
      "address":"0x79417A0F4A8339cC54d13d22C18D95009a721D44",
      "amount":ethers.utils.parseUnits("3" + ("0" * 15))
    }
  ]
  const token = await TokenDeployer.deployTokenModule({
    name: name,
    symbol:symbol
  })
  const mint = await token.mintBatchTo(contributors)