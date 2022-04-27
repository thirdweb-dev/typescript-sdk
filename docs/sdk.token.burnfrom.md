<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@thirdweb-dev/sdk](./sdk.md) &gt; [Token](./sdk.token.md) &gt; [burnFrom](./sdk.token.burnfrom.md)

## Token.burnFrom() method

Burn Tokens

<b>Signature:</b>

```typescript
burnFrom(holder: string, amount: Amount): Promise<TransactionResult>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  holder | string |  |
|  amount | [Amount](./sdk.amount.md) |  |

<b>Returns:</b>

Promise&lt;[TransactionResult](./sdk.transactionresult.md)<!-- -->&gt;

## Remarks

Burn tokens held by the specified wallet

## Example


```javascript
// Address of the wallet sending the tokens
const holderAddress = "{{wallet_address}}";

// The amount of this token you want to burn
const amount = 1.2;

await contract.burnFrom(holderAddress, amount);
```
