import { DropModule, ThirdwebSDK } from "../src/index";
import * as chai from "chai";
import { createReadStream, readdirSync } from "fs";
import { appModule, sdk, signers } from "./before.test";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Batch uploading", async () => {
  let dropModule: DropModule;
  let adminWallet: SignerWithAddress;
  beforeEach(async () => {
    [adminWallet] = signers;
    console.log("Creating drop module");
    sdk.setProviderOrSigner(adminWallet);
    dropModule = sdk.getDropModule(
      await appModule
        .deployDropModule({
          name: "Test Drop",
          maxSupply: 1000,
          primarySaleRecipientAddress: AddressZero,
        })
        .then((drop) => drop.address),
    );
    console.log("Created drop module at address: ", dropModule.address);
  });

  it("should upload bulk", async () => {
    const folder = await readdirSync("test/images");
    const filelist = [];
    folder.forEach((file) => {
      filelist.push(createReadStream(`test/images/${file}`));
    });
    const ipfsUri = await sdk
      .getStorage()
      .uploadBatch(filelist, dropModule.address);
    const regex = new RegExp(
      /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/,
    );
    chai.assert.isTrue(regex.test(ipfsUri));
  });
});
