import { AddressZero } from "@ethersproject/constants";
import * as chai from "chai";
import { BigNumber, ethers } from "ethers";
import { JsonConvert } from "json2typescript";
import { AppModule, BundleModuleMetadata, ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("App Module", async () => {
  let sdk: ThirdwebSDK;
  let appModule: AppModule;

  beforeEach(async () => {
    if (process.env.PKEY) {
      sdk = new ThirdwebSDK(
        new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
      );
    } else {
      sdk = new ThirdwebSDK(RPC_URL);
    }
    appModule = sdk.getAppModule("0xA47220197e8c7F7ec462989Ca992b706747B77A8");
  });

  it("should serialize metadata correctly", async () => {
    const tests: {
      expected: any;
      test: BundleModuleMetadata;
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
        type: BundleModuleMetadata,
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
        } as BundleModuleMetadata,
        type: BundleModuleMetadata,
      },
      {
        expected: {
          name: "Testing",
        },
        test: {
          name: "Testing",
        } as BundleModuleMetadata,
        type: BundleModuleMetadata,
      },
    ];

    const jsonConvert = new JsonConvert();
    for (const test of tests) {
      const result = jsonConvert.serializeObject(test.test, test.type);
      chai.assert.deepEqual(result, test.expected);
    }
  });

  it.skip("should deploy a collection module successfully", async () => {
    const module = await appModule.deployBundleModule({
      name: "Testing module from SDK",
      sellerFeeBasisPoints: 1000,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
    });
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

  it.skip("should deploy an nft module successfully", async () => {
    await appModule.deployNftModule({
      name: "Testing module from SDK",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      sellerFeeBasisPoints: 0,
    });
  });

  it.skip("should deploy a currency module successfully", async () => {
    await appModule.deployCurrencyModule({
      name: "Testing currency from SDK",
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      symbol: "TEST",
    });
  });

  it.skip("should deploy a marketplace module successfully", async () => {
    const result = await appModule.deployMarketModule({
      name: `Testing market from SDK - ${new Date().toLocaleString()}`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      marketFeeBasisPoints: 100,
    });
    await sdk.getMarketModule(result.address);
  });

  it.skip("should deploy a pack module successfully", async () => {
    const result = await appModule.deployPackModule({
      name: `Testing pack from SDK - ${new Date().toLocaleString()}`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      sellerFeeBasisPoints: 100,
    });
    await sdk.getPackModule(result.address);
  });

  it.skip("should deploy a drop module successfully", async () => {
    const result = await appModule.deployDropModule({
      name: `Testing drop from SDK - ${new Date().toLocaleString()}`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      sellerFeeBasisPoints: 100,
      maxSupply: 10,
      baseTokenUri: "/test",
      primarySaleRecipientAddress: AddressZero,
    });
    console.log("deplyed with address", result.address);

    const module = await sdk.getDropModule(result.address);
    chai.assert.equal(
      (await module.maxTotalSupply()).toNumber(),
      10,
      "The max supply should be 10",
    );
  });

  it.skip("should deploy a datastore module successfully", async () => {
    const result = await appModule.deployDatastoreModule({
      name: `Testing drop from SDK - ${new Date().toLocaleString()}`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
    });
    console.log("deplyed datastore with address", result.address);

    await sdk.getDatastoreModule(result.address);
  });

  it.skip("should return the correct balance", async () => {
    const nativeBalance = await appModule.balance();
    chai.assert.equal(nativeBalance.toString(), "10000000000000000");

    const testBalance = await appModule.balanceOfToken(
      "0xf18feb8b2f58691d67c98db98b360840df340e74",
    );
    chai.assert.equal(testBalance.displayValue, "100.0");
  });
});
