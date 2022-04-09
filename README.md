# Thirdweb SDK

[Looking for version 1 (legacy)? Click here.](https://github.com/thirdweb-dev/typescript-sdk/tree/v1)

## Installation

Install the latest version of the SDK with `npm`:

```shell
npm install @thirdweb-dev/sdk ethers
```
or with `yarn`:
```shell
yarn add @thirdweb-dev/sdk ethers
```

## Quick start

### 1. Deploy & customize your contracts

- Using your [thirdweb dashboard](https://thirdweb.com/dashboard) (recommended)
- Using the SDK directly (for advanced use cases)

### 2. Reading data from your contracts

Quickest way to get started is to use the SDK as read only (no transactions).
This will allow you to query data from any contract with no additional setup.

```typescript
// my_script.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

// The RPC url determines which blockchain you want to connect to
const rpcUrl = "https://polygon-rpc.com/";
// instantiate the SDK as read only on a given blockchain
const sdk = new ThirdwebSDK(rpcUrl);

// access your deployed contracts
const nftDrop = sdk.getNFTDrop("0x...");
const marketplace = sdk.getMarketplace("0x...");

// Read from your contracts
const claimedNFTs = await nftDrop.getAllClaimed();
const listings = await marketplace.getActiveListings();
```

You can execute this code as a node script by executing:
```shell
npx ts-node my_script.ts
```

### 3. Executing transactions on your contracts

In order to execute transactions on your contract, the SDK needs to know which wallet is executing those transactions.
This can be done two ways:

- Using your own private key (typically used in the backend or scripts)
- By connecting to a user wallet (typically used in the frontend)

### Backend / Scripting usage

Here's how to provide your own private key to the SDK to perform transactions with your account from scripts or from a node.js backend:

```typescript
// my_script.ts
import "dotenv/config";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

// still need an RPC url to determine which blochain to connect to
const rpcUrl = "https://polygon-rpc.com/";
// load your private key in a secure way (env variable, not commited to git)
const privateKey = process.env.PRIVATE_KEY as string;
// instantiate the SDK with your own wallet (or any valid Signer)
const sdk = new ThirdwebSDK(
    new Wallet(
        privateKey,
        ethers.getDefaultProvider(rpcUrl)
    )
);

// access your deployed contracts
const nftCollection = sdk.getNFTCollection("0x...");

// Execute transactions on your contracts from the connected wallet
await nftCollection.mint({
    name: "Cool NFT",
    description: "Minted NFT from code!",
    image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
});
```

In this example we use [dotenv](https://www.npmjs.com/package/dotenv) to store the PRIVATE_KEY in an `.env` file, like the following:

```
PRIVATE_KEY=your-private-key-here
```

You could also store your private key in a shell environment variable, or load it from a secure service.

> ⚠️ Never commit private keys to file tracking history, or share it publicly. If you're using an env file, make sure to add `.env` to your `.gitignore` file.

### Frontend usage

For frontend applications, head over to our [React Github repo](https://github.com/thirdweb-dev/react) which shows you how to connect to a user's wallet like Metamask, and automatically instantiate the thirdweb SDK for you.

Easiest way to get started on the frontend is using one of our templates in the [thirdweb examples repo](https://github.com/thirdweb-example).

### API Reference & code examples

- [Step by step guides and recipes](https://portal.thirdweb.com)
- [Api Reference and code examples](https://typescript-docs.thirdweb.com)

### Get in touch

- [Discord](https://discord.gg/thirdweb)
- [Twitter](https://twitter.com/thirdweb_/)
