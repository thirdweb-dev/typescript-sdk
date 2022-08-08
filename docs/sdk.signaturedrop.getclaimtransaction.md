<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@thirdweb-dev/sdk](./sdk.md) &gt; [SignatureDrop](./sdk.signaturedrop.md) &gt; [getClaimTransaction](./sdk.signaturedrop.getclaimtransaction.md)

## SignatureDrop.getClaimTransaction() method

Construct a claim transaction without executing it. This is useful for estimating the gas cost of a claim transaction, overriding transaction options and having fine grained control over the transaction execution.

<b>Signature:</b>

```typescript
getClaimTransaction(destinationAddress: string, quantity: BigNumberish, checkERC20Allowance?: boolean): Promise<TransactionTask>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  destinationAddress | string |  |
|  quantity | BigNumberish |  |
|  checkERC20Allowance | boolean | <i>(Optional)</i> |

<b>Returns:</b>

Promise&lt;TransactionTask&gt;
