import { MockStorage } from "./mock/MockStorage";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, assert } from "chai";
import { BigNumber, ethers } from "ethers";
import { readFileSync } from "fs";
import { JsonConvert } from "json2typescript";
import { NATIVE_TOKEN_ADDRESS } from "../src/common/currency";
import {
  AppModule,
  BundleModuleMetadata,
  DropModule,
  IpfsStorage,
} from "../src/index";
import {
  appModule,
  ipfsGatewayUrl,
  registryAddress,
  sdk,
  signers,
} from "./before.test";
import { ProtocolControlV1__factory } from "./oldFactories/ProtocolControlV1";

describe("App Module", async () => {
  let dropModule: DropModule;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  let storageUriPrefix: string;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet] = signers;
    await sdk.updateSignerOrProvider(signers[0]);

    // const storage = sdk.getStorage();
    // if (storage instanceof IpfsStorage) {
    //   storageUriPrefix = "ipfs://";
    // } else if (storage instanceof MockStorage) {
    //   storageUriPrefix = "mock://";
    // }
  });

  it.skip("should serialize metadata correctly", async () => {
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
      assert.deepEqual(result, test.expected);
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
  });

  it.skip("Should return a valid splits module", async () => {
    const module = await sdk.getSplitsModule(
      "0x255d57Be74C055Bdd29Dfb7c714EEfFdd2492163",
    );
  });

  it.skip("should deploy an nft module with an image file successfully", async () => {
    const filePath = `${__dirname}/3510820011_4f558b6dea_b.jpg`;
    const image = readFileSync(filePath);
    const module = await appModule.deployNftModule({
      name: "Testing module from SDK",
      sellerFeeBasisPoints: 0,
      image,
    });

    const metadata = await module.getMetadata(false);
    assert.isTrue(
      sdk.getStorage().canResolve(metadata.metadata.image),
      `Image property = ${metadata.metadata.image}, should include fake://`,
    );
  });

  it.skip("should deploy a currency module successfully", async () => {
    const image =
      "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg";
    const module = await appModule.deployCurrencyModule({
      name: "Testing currency from SDK",
      image,
      symbol: "TEST",
    });

    const metadata = await module.getMetadata();
    assert.equal(
      metadata.metadata.image,
      image,
      `Image property = ${metadata.metadata.image}, should include ipfs/`,
    );
  });

  it.skip("should deploy a marketplace module successfully", async () => {
    const result = await appModule.deployMarketModule({
      name: `Testing market from SDK`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      marketFeeBasisPoints: 100,
    });
    await sdk.getMarketModule(result.address);
  });

  it.skip("should deploy a pack module successfully", async () => {
    const splits = await appModule.deploySplitsModule({
      name: `Testing pack from SDK`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      recipientSplits: [
        {
          address: samWallet.address,
          shares: 1,
        },
      ],
    });

    const result = await appModule.deployPackModule({
      name: `Testing pack from SDK`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      sellerFeeBasisPoints: 100,
      feeRecipient: splits.address,
    });
    const contract = await sdk.getPackModule(result.address);
    assert.equal(
      await contract.getRoyaltyRecipientAddress(),
      splits.address,
      "Royalty recipient address was not updated",
    );
  });

  it("should deploy a drop module successfully", async () => {
    const address = await sdk.factory.deploy("DropERC721", {
      name: `Testing drop from SDK`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      platform_fee_recipient: AddressZero,
    });

    console.log("Address: ", address);

    const dropModule = sdk.getDropModule(address);

    const metadata = await dropModule.metadata.get();
    console.log("Metadata: ", metadata);

    const owner = await dropModule.ownerOf("0");
    console.log("Owner: ", owner);
  });

  it.skip("should deploy a datastore module successfully", async () => {
    const result = await appModule.deployDatastoreModule({
      name: `Testing drop from SDK`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
    });

    await sdk.getDatastoreModule(result.address);
  });

  it.skip("should throw an error if the fee recipient is not a protocl control or splits module", async () => {
    try {
      const result = await appModule.deployBundleDropModule({
        name: `Testing drop from SDK`,
        image:
          "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
        primarySaleRecipientAddress: samWallet.address,
        feeRecipient: samWallet.address,
      });
    } catch (err) {
      if (
        !(err.message as string).includes(
          "can only be the Project address or a Splits module address",
        )
      ) {
        throw err;
      }
    }
  });

  it.skip("should allow image fields to pass-through as a string", async () => {
    const metadata = {
      name: "safe",
      description: "",
      image: `${storageUriPrefix}/image`,
      sellerFeeBasisPoints: 0,
      symbol: "",
    };
    const contract = await appModule.deployBundleModule(metadata);
    const module = sdk.getBundleModule(contract.address);

    const unresolved = await module.getMetadata(false);
    assert.equal(unresolved.metadata.image, `${storageUriPrefix}/image`);
  });

  it.skip("should deploy a bundle drop module correctly", async () => {
    const contract = await appModule.deployBundleDropModule({
      name: `Testing bundle drop from SDK`,
      image:
        "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
      sellerFeeBasisPoints: 100,
      primarySaleRecipientAddress: AddressZero,
    });
    sdk.getBundleDropModule(contract.address);
  });

  it.skip("should upload image to storage if image is file", async () => {
    const metadata = {
      name: "safe",
      description: "",
      image: readFileSync(`${__dirname}/3510820011_4f558b6dea_b.jpg`),
      sellerFeeBasisPoints: 0,
      fee_recipient: "0xabE01399799888819f5dCE731F8C22f8E7e6AD26",
      symbol: "",
    };
    const contract = await appModule.deployBundleModule(metadata);
    const module = sdk.getBundleModule(contract.address);
    const result = await module.getMetadata(false);
    assert.isTrue(
      result.metadata.image.startsWith(storageUriPrefix),
      "The image property should have been replaced with a storage hash",
    );
  });

  it.skip("should allow you to withdraw funds", async () => {
    await adminWallet.sendTransaction({
      value: ethers.utils.parseEther("0.1"),
      to: appModule.address,
    });

    const dummyWallet = ethers.Wallet.createRandom().connect(
      adminWallet.provider,
    );

    await appModule.withdrawFunds(dummyWallet.address, NATIVE_TOKEN_ADDRESS);
  });

  describe.skip("V1 -> V2", () => {
    let v1Module: AppModule;

    beforeEach(async () => {
      const meta = {
        name: "Test Module",
      };
      const ipfsUri = await sdk.getStorage().upload(JSON.stringify(meta));

      const moduleDeployer = await new ethers.ContractFactory(
        ProtocolControlV1__factory.abi,
        ProtocolControlV1__factory.bytecode,
      )
        .connect(adminWallet)
        .deploy(registryAddress, samWallet.address, ipfsUri);
      await moduleDeployer.deployed();
      v1Module = sdk.getAppModule(moduleDeployer.address);
      await v1Module.setProviderOrSigner(samWallet);
    });

    it("should allow you to upgrade your project", async () => {
      await v1Module.upgradeToV2();
    });

    it("should allow withdrawls after upgrading", async () => {
      await v1Module.upgradeToV2();

      await adminWallet.sendTransaction({
        value: ethers.utils.parseEther("0.1"),
        to: v1Module.address,
      });

      await adminWallet.sendTransaction({
        value: ethers.utils.parseEther("0.1"),
        to: await v1Module.getRoyaltyTreasury(),
      });

      await v1Module.withdrawFunds(
        samWallet.address,
        "0x0000000000000000000000000000000000000000",
      );
    });

    it("should upgrade module metadata", async () => {
      await v1Module.deployNftModule({
        name: "Test NFT",
        symbol: "TST",
        image: `${storageUriPrefix}test_image`,
        feeRecipient: v1Module.address,
        sellerFeeBasisPoints: 0,
      });

      expect((await v1Module.shouldUpgradeModuleList()).length).to.equal(0);
      await v1Module.upgradeToV2();

      const upgradeList = await v1Module.shouldUpgradeModuleList();
      const nftAddress = upgradeList[0].address;
      expect(upgradeList.length).to.equal(1);
      await v1Module.upgradeModuleList([nftAddress]);
      expect((await v1Module.shouldUpgradeModuleList()).length).to.equal(0);
    });
  });
});
