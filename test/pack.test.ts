import { INFTBundleCreateArgs } from "./../src/modules/bundle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BundleModule, PackModule } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

global.fetch = require("node-fetch");

// TODO: Write some actual pack module tests
describe("Pack Module", async () => {
  let packModule: PackModule;
  let bundleModule: BundleModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
    packModule = await appModule.deployPackModule({
      name: "Pack Module",
      sellerFeeBasisPoints: 1000,
      feeRecipient: samWallet.address,
    });

    bundleModule = await appModule.deployBundleModule({
      name: "NFT Module",
      sellerFeeBasisPoints: 1000,
    });
  });

  describe("Creating Packs", () => {
    beforeEach(async () => {
      const batch: INFTBundleCreateArgs[] = [];
      for (let i = 0; i < 5; i++) {
        batch.push({
          metadata: {
            name: `Test ${i}`,
          },
          supply: 1000,
        });
      }

      await bundleModule.createAndMintBatch(batch);
    });

    it("should allow you to create a batch of packs", async () => {
      console.log("Creating packs");
      await packModule.createPack({
        assetContract: bundleModule.address,
        assets: [
          {
            tokenId: "0",
            amount: 10,
          },
          {
            tokenId: "1",
            amount: 10,
          },
        ],
        metadata: {
          name: "Test Pack",
        },
      });

      let attempts = 0;
      while (attempts < 10) {
        try {
          const pack = await packModule.getAll();
          console.log(pack);
          break;
        } catch (err) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts += 1;
        }
      }
    });
  });
});
