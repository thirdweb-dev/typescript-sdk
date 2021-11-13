import * as chai from "chai";
import { BigNumber, ethers } from "ethers";
import { JsonConvert } from "json2typescript";
import { AppModule, CollectionModuleMetadata, ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("App Module", async () => {
  let sdk: ThirdwebSDK;
  let appModule: AppModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
    );
    appModule = sdk.getAppModule("0xA47220197e8c7F7ec462989Ca992b706747B77A8");
  });

  it("should serialize metadata correctly", async () => {
    const tests: {
      expected: any;
      test: CollectionModuleMetadata;
      type: any;
    }[] = [
      {
        expected: {
          name: "Testing",
          description: "Test description",
          external_link: "https://google.com",
          seller_fee_basis_points: 100,
        },
        test: {
          name: "Testing",
          description: "Test description",
          externalLink: "https://google.com",
          sellerFeeBasisPoints: 100,
        },
        type: CollectionModuleMetadata,
      },
      {
        expected: {
          name: "Testing",
          description: "Test description",
          external_link: "https://google.com",
          seller_fee_basis_points: 100,
          fee_recipient: "0x0",
          image: "test",
        },
        test: {
          name: "Testing",
          description: "Test description",
          externalLink: "https://google.com",
          sellerFeeBasisPoints: 100,
          feeRecipient: "0x0",
          image: "test",
        } as CollectionModuleMetadata,
        type: CollectionModuleMetadata,
      },
      {
        expected: {
          name: "Testing",
        },
        test: {
          name: "Testing",
        } as CollectionModuleMetadata,
        type: CollectionModuleMetadata,
      },
    ];

    const jsonConvert = new JsonConvert();
    for (const test of tests) {
      const result = jsonConvert.serializeObject(test.test, test.type);
      chai.assert.deepEqual(result, test.expected);
    }
  });

  it.skip("should deploy a collection module successfully", async () => {
    const module = await appModule.deployCollectionModule({
      name: "Testing module from SDK",
      sellerFeeBasisPoints: 1000,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
    });

    console.log("DEPLOYED MODULE =", module);
  });

  it.skip("should deploy a splits module successfully", async () => {
    const module = await appModule.deploySplitsModule({
      name: "Testing module from SDK",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      // this represents a 50/50 split (excluding the Thirdweb platform 5% cut)
      recipientSplits: [
        {
          address: "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
          shares: BigNumber.from(100),
        },
        {
          address: "0x4d36d531D9cB40b8694763123D52170FAE5e1195",
          shares: BigNumber.from(100),
        },
      ],
    });

    console.log("DEPLOYED MODULE =", module);
  });

  it("Should return a valid splits module", async () => {
    const module = await sdk.getSplitsModule(
      "0x255d57Be74C055Bdd29Dfb7c714EEfFdd2492163",
    );

    console.log(await module.getAllRecipients());
  });
});
