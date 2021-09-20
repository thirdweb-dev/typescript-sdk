# pack-protocol-sdk


#### Examples
https://github.com/nftlabs/pack-protocol-sdk/blob/main/example/index.js

Getting Pack ID = 7.


**SDK.pack.getPack(7)**
```js
{
  uri: 'ipfs://bafkreieioqyhqwyvctw5wkm44apmvqsjnvluptlfup6p77flgvfheyh4ba',
  name: 'Pack #6',
  description: 'Pack #6',
  image: 'https://cloudflare-ipfs.com/ipfs/bafybeienhductsh5w247d6bsoqml2v5q3bntbqnrjzllnuealiwl3lwaru',
  creator: '0xBaf36227160A1468b9f2a90B1194Fa34d00Ef38F',
  currentSupply: BigNumber { _hex: '0xc8', _isBigNumber: true },
  openStart: 1970-01-19T21:14:37.444Z,
  openEnd: null
}
```

**SDK.pack.getRewards(7)**
```js
[
  {
    uri: 'ipfs://bafkreig4g6i725ey2ampkucrti4aobuy6mkpmk4oawmw5v4zrjrsu35gq4',
    name: 'Reward #1',
    image: 'https://cloudflare-ipfs.com/ipfs/bafkreigua6rudnlybyc6spovzd7k54wwf7bbvlerrr2bk6dzm5ko4w4lby',
    description: 'Reward #1 Reward',
    supply: BigNumber { _hex: '0x64', _isBigNumber: true }
  },
  {
    uri: 'ipfs://bafkreihzg5l6yffxd2fhys325muqblhiycivdyblwymejcv6xpk7rp5flq',
    name: 'Reward #2',
    image: 'https://cloudflare-ipfs.com/ipfs/bafkreifpa4uj5dazctj4qui5g4eqwrgeax27lztj43tk5tarxkooh5hl2i',
    description: 'Reward #2 Reward',
    supply: BigNumber { _hex: '0x64', _isBigNumber: true }
  }
]
```
