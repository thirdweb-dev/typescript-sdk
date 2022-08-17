<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@thirdweb-dev/sdk](./sdk.md) &gt; [DropErc1155ClaimConditions](./sdk.droperc1155claimconditions.md) &gt; [prepareClaim](./sdk.droperc1155claimconditions.prepareclaim.md)

## DropErc1155ClaimConditions.prepareClaim() method

Returns proofs and the overrides required for the transaction.

<b>Signature:</b>

```typescript
prepareClaim(tokenId: BigNumberish, quantity: BigNumberish, checkERC20Allowance: boolean): Promise<ClaimVerification>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  tokenId | BigNumberish |  |
|  quantity | BigNumberish |  |
|  checkERC20Allowance | boolean |  |

<b>Returns:</b>

Promise&lt;[ClaimVerification](./sdk.claimverification.md)<!-- -->&gt;

- `overrides` and `proofs` as an object.
