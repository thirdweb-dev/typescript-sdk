import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MarketplaceModule } from "../src/modules/marketplace";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

describe("Marketplace Module", async () => {
  let marketplaceModule: MarketplaceModule;
  let adminWallet,
    samWallet,
    abbyWallet,
    bobWallet,
    w1,
    w2,
    w3,
    w4: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;
    console.log("Creating drop module");
    await sdk.setProviderOrSigner(adminWallet);
    marketplaceModule = await appModule.deployMarketplaceModule({
      name: "Test Marketplace",
      marketFeeBasisPoints: 100,
    });
    console.log(
      "Created marketplace module at address: ",
      marketplaceModule.address,
    );
  });

  it("", async () => {
    console.log("HI");
  });
});
