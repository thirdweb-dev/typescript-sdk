<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@thirdweb-dev/sdk](./sdk.md) &gt; [Erc1155Droppable](./sdk.erc1155droppable.md) &gt; [claim](./sdk.erc1155droppable.claim.md)

## Erc1155Droppable.claim property

Claim tokens and configure claim conditions

<b>Signature:</b>

```typescript
claim: Erc1155Claimable | undefined;
```

## Remarks

Let users claim NFTs. Define who can claim NFTs in the collection, when and how many.

## Example


```javascript
const quantity = 10;
const tokenId = 0;
await contract.edition.drop.claim.to("0x...", 0, quantity);
```
