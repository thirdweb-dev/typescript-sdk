<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [TokenModule](./sdk.tokenmodule.md) &gt; [transfer](./sdk.tokenmodule.transfer.md)

## TokenModule.transfer() method

Transfer Tokens

<b>Signature:</b>

```typescript
transfer(to: string, amount: BigNumberish): Promise<TransactionReceipt>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  to | string |  |
|  amount | BigNumberish |  |

<b>Returns:</b>

Promise&lt;TransactionReceipt&gt;

## Remarks

Transfer tokens from the connected wallet to another wallet.

## Example


```javascript
// Address of the wallet you want to send the tokens to
const toAddress = "0x...";

// The amount of tokens you want to send
const amount = 0;

await module.transfer(toAddress, amount);
```
