<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [TokenErc721Contract](./sdk.tokenerc721contract.md) &gt; [mint](./sdk.tokenerc721contract.mint.md)

## TokenErc721Contract.mint() method

Mint NFT

<b>Signature:</b>

```typescript
mint(metadata: NFTMetadataInput): Promise<TransactionResultWithId<NFTMetadataOwner>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  metadata | NFTMetadataInput |  |

<b>Returns:</b>

Promise&lt;TransactionResultWithId&lt;NFTMetadataOwner&gt;&gt;

## Remarks

Mint an NFT to the connected wallet.

## Example


```javascript
// Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
const metadata = {
  name: "Cool NFT",
  description: "This is a cool NFT",
  image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
}

await contract.mint(metadata);
```
