import { AddressZero } from "@ethersproject/constants";
import * as chai from "chai";
import { BigNumber, ethers } from "ethers";
import ClaimConditionFactory from "../src/factories/ClaimConditionFactory";
import { DropModule, PublicMintCondition, ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("ClaimConditionFactory", async () => {
  let sdk: ThirdwebSDK;
  let dropModule: DropModule;

  let factory: ClaimConditionFactory;
  let conditions: PublicMintCondition[];

  const phaseOneStartTimeInSeconds =
    Date.parse("01 Dec 2021 00:00:00 GMT") / 1000;
  const phaseOneStartDate = new Date(phaseOneStartTimeInSeconds * 1000);
  const phaseOneCurency = AddressZero;
  const phaseOnePrice: BigNumber = ethers.utils.parseUnits("10", 18);
  const phaseOneMaxQuantity = 10;

  const phaseTwoStartTimeInSeconds =
    Date.parse("10 Dec 2021 00:00:00 GMT") / 1000;
  const phaseTwoStartDate = new Date(phaseTwoStartTimeInSeconds * 1000);
  const phaseTwoCurrency = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
  const phaseTwoPrice: BigNumber = ethers.utils.parseUnits("100", 18);
  const phaseTwoMaxQuantityPerTransaction = 10;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(process.env.PKEY, ethers.getDefaultProvider(RPC_URL)),
    );
    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */
    dropModule = sdk.getDropModule(
      "0x3705506b3ce08b94cf8b1EA41CDe005669B45e37",
    );

    // This will get the factory of an existing drop
    factory = await dropModule.getMintConditionsFactory();

    // You can also instantiate the factory and import a modules existing
    // mint conditions like this:
    // const newFactory = new ClaimConditionFactory();
    // newFactory.fromPublicMintConditions(
    //   await dropModule.getAllMintConditions(),
    // );

    // These conditions will apply on December 10th
    // You need 100 ENS tokens to claim a token
    factory
      .newClaimPhase({
        startTime: phaseTwoStartTimeInSeconds,
        maxQuantityPerTransaction: phaseTwoMaxQuantityPerTransaction,
      })
      .setPrice(phaseTwoPrice, phaseTwoCurrency);

    // These conditions will apply on December 1st
    // You need 100 NATIVE tokens to claim a token
    // There is a maximum of 10 tokens in this phase
    factory
      .newClaimPhase({
        startTime: phaseOneStartDate,
        maxQuantity: phaseOneMaxQuantity,
      })
      .setPrice(phaseOnePrice);

    conditions = factory.buildConditions();
  });

  it("should contain all claim conditions", async () => {
    chai.assert.equal(
      conditions.length,
      2,
      "There should be two claim conditions",
    );
  });

  it("should be in ascending order by start time", async () => {
    chai.assert.equal(
      conditions[0].maxMintSupply.toString(),
      phaseOneMaxQuantity.toString(),
      "Max supply should be 10 which is the supply of phase 1",
    );
  });

  it("should convert Date objects to epoch timestamp in seconds", async () => {
    const secondClaim = conditions[1];

    chai.assert.equal(
      secondClaim.startTimestamp.toNumber(),
      phaseTwoStartTimeInSeconds,
      "The second condition should have the start time of the second phase",
    );
  });

  it("should use the native currency if setPrice is called with no second parameter", async () => {
    const firstClaim = conditions[0];

    chai.assert.equal(
      firstClaim.currency,
      AddressZero,
      "The first claim currency should be 0x000... (native currency)",
    );
  });

  it("should default to (MAX Uint 256) max mint supply", async () => {
    const secondClaim = conditions[1];
    chai.assert.equal(
      secondClaim.maxMintSupply,
      ethers.constants.MaxUint256,
      "Default max mint supply MAX Uint 256",
    );
  });

  it("should delete phases correctly", async () => {
    factory.removeClaimPhase(0);

    const newConditions = factory.buildConditions();

    chai.assert.lengthOf(
      newConditions,
      1,
      "Only one phase should remain after removing another one",
    );

    chai.assert.equal(
      newConditions[0].currency,
      phaseTwoCurrency,
      "The currency of the remaining phase should be equal to the second phase",
    );
  });

  it("should set the prices correctly", async () => {
    chai.assert.equal(
      conditions[0].pricePerToken,
      phaseOnePrice,
      "Phase one price should be set correctly",
    );

    chai.assert.equal(
      conditions[1].pricePerToken,
      phaseTwoPrice,
      "Phase two price should be set correctly",
    );
  });

  it("should set the currencies correctly", async () => {
    chai.assert.equal(
      conditions[0].currency,
      phaseOneCurency,
      "Phase one price should be set correctly",
    );

    chai.assert.equal(
      conditions[1].currency,
      phaseTwoCurrency,
      "Phase two price should be set correctly",
    );
  });

  it("should allow overriding `maxQuantityPerTransaction`", async () => {
    chai.assert.equal(
      conditions[1].quantityLimitPerTransaction.toString(),
      phaseTwoMaxQuantityPerTransaction.toString(),
      "Phase two `maxQuantityPerTransaction` should be set correctly",
    );
  });

  it("should set the correct default `maxQuantityPerTransaction`", async () => {
    chai.assert.equal(
      conditions[0].quantityLimitPerTransaction.toString(),
      ethers.constants.MaxUint256.toString(),
      "Phase one `maxQuantityPerTransaction` should be set to Max Uint 256",
    );
  });
});
