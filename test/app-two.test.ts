import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ClaimConditionFactory, DropModule } from "../src/index";
import { appModule, signers } from "./before.test";

global.fetch = require("node-fetch");

describe("App Two Module", async () => {
  let dropModule: DropModule;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet] = signers;

    console.log("Creating drop module");
    dropModule = await appModule.deployDropModule({
      name: "Test Drop",
      maxSupply: 1000,
      primarySaleRecipientAddress: AddressZero,
    });
    console.log("Created drop module at address: ", dropModule.address);

    const factory = new ClaimConditionFactory();
    factory.newClaimPhase({
      startTime: new Date(),
    });
    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");
  });

  it("should return a newly minted token", async () => {
    await dropModule.lazyMintAmount(10);

    const result = await dropModule.claim(1);
    console.log(result);
  });
});
