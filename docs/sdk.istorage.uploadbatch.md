<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [IStorage](./sdk.istorage.md) &gt; [uploadBatch](./sdk.istorage.uploadbatch.md)

## IStorage.uploadBatch() method

Uploads a folder to storage.

<b>Signature:</b>

```typescript
uploadBatch(files: Buffer[] | string[] | FileOrBuffer[] | File[] | BufferOrStringWithName[], contractAddress?: string, uploadFileStartNumber?: number): Promise<string>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  files | Buffer\[\] \| string\[\] \| FileOrBuffer\[\] \| File\[\] \| BufferOrStringWithName\[\] |  |
|  contractAddress | string | Optional. The contract address the data belongs to. |
|  uploadFileStartNumber | number | Optional. The first file file name begins with. |

<b>Returns:</b>

Promise&lt;string&gt;

- The CID of the uploaded folder.
