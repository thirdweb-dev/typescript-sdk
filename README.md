# Thirdweb SDK

[Looking for version 1 (legacy)? Click here.](https://github.com/thirdweb-dev/typescript-sdk/tree/v1)

### Installation

Install the latest version of the SDK with `npm`:

```bash
npm install @thirdweb-dev/sdk ethers
```
or with `yarn`:
```bash
yarn add @thirdweb-dev/sdk ethers
```

### Quick start

1. Deploy & customize your contracts

- Using your [thirdweb dashboard](https://thirdweb.com/dashboard) (recommended)
- Using the SDK directly (for advanced use cases)

2. Interact with your contracts from your own code using the thirdweb SDK

```javascript
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

// instantiate the SDK with a read only RPC url or a Signer to perform transactions
const sdk = new ThirdwebSDK("your_rpc_url_or_signer");

// access your deployed contracts
const nftDrop = sdk.getNFTDrop("0x...");
const marketplace = sdk.getMarketplace("0x...");

// Read from your contract
const listings = await marketplace.getAllListings();

// Perform transactions (requires a signer)
await marketplace.buyoutDirectListing(listingId, quantityDesired);
```

### Api Reference & code examples

- [Step by step guides and recipes](https://portal.thirdweb.com)
- [Api Reference and code examples](https://typescript-docs.thirdweb.com)

### Get in touch

- [Discord](https://discord.gg/thirdweb)
- [Twitter](https://twitter.com/thirdweb_/)
