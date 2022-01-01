import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BundleDropModule,
  NATIVE_TOKEN_ADDRESS,
  ThirdwebSDK,
} from "../src/index";
import { appModule, registryAddress, signers } from "./before.test";
import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { BigNumber } from "ethers";

global.fetch = require("node-fetch");

describe("Bundle Module (aka Collection Module)", async () => {
  let bundleDropModule: BundleDropModule;

  let adminWallet: SignerWithAddress;
  let testSigners: SignerWithAddress[];

  it.skip("should be able to claim using 15000 addresses", async () => {
    [adminWallet] = signers;
    testSigners = [];
    console.time("wallet");
    for (let i = 0; i < 15000; i++) {
      testSigners.push(new ethers.Wallet.createRandom());
      console.log(`${testSigners[i].address} was created`);
    }
    console.log("===WALLETS CREATED===");
    console.timeEnd("wallet");
    const token = await appModule.deployCurrencyModule({
      name: "Test Token",
      symbol: "TST",
    });

    console.log("testSigners", testSigners.length);
    const allowList = [];
    testSigners.forEach((signer) => {
      try {
        allowList.push(signer.address);
      } catch (e) {
        console.log(signer);
      }
    });
    bundleDropModule = await appModule.deployBundleDropModule({
      name: "test",
      description: "test",
      primarySaleRecipientAddress: "0x0000000000000000000000000000000000000000",
    });
    await bundleDropModule.lazyMintBatch([{ name: "test" }]);

    console.log("bundleDropModule", bundleDropModule.address);

    const factory = bundleDropModule.getClaimConditionFactory();
    const claimPhase = factory.newClaimPhase({
      startTime: new Date(),
      maxQuantity: 30000,
      maxQuantityPerTransaction: 1,
    });
    claimPhase.setPrice(ethers.utils.parseEther("0.01"), NATIVE_TOKEN_ADDRESS);
    await claimPhase.setSnapshot(allowList);

    await bundleDropModule.setClaimCondition("0", factory);
    const sdk = new ThirdwebSDK(adminWallet, {
      ipfsGatewayUrl: "https://ipfs.thirdweb.com/ipfs/",
      registryContractAddress: registryAddress,
      maxGasPriceInGwei: 10000,
    });
    let error = false;
    await sdk
      .getBundleDropModule(bundleDropModule.address)
      .claim(0, 1)
      .catch((e) => {
        error = true;
      });
    assert.equal(error, true);
    for (let i = 0; i < testSigners.length; i++) {
      assert(adminWallet.address !== testSigners[i].address);
      const signer = testSigners[i].connect(ethers.provider);
      await adminWallet.sendTransaction({
        from: adminWallet.address,
        to: signer.address,
        value: ethers.utils.parseEther("0.02"),
      });
      assert((await signer.getBalance()).gt(0));
      const testSdk = new ThirdwebSDK(signer, {
        ipfsGatewayUrl: "https://ipfs.thirdweb.com/ipfs/",
        registryContractAddress: registryAddress,
        maxGasPriceInGwei: 10000,
      });
      await testSdk.getBundleDropModule(bundleDropModule.address).claim(0, 1);
      console.log("claimed", i);
    }

    console.log("claimed successfully for all");
  });
});
