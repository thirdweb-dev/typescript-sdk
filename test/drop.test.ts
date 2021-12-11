import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ClaimConditionFactory from "../src/factories/ClaimConditionFactory";
import { DropModule } from "../src/index";

import { appModule, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

describe("Drop Module", async () => {
  let dropModule: DropModule;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    abbyWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet, abbyWallet] = signers;

    console.log("Creating drop module");
    dropModule = await appModule.deployDropModule({
      name: "Test Drop",
      maxSupply: 1000,
      primarySaleRecipientAddress: AddressZero,
    });
    console.log("Created drop module at address: ", dropModule.address);
  });

  it("should allow a snapshot to be set", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
    ]);

    const secondPhase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await secondPhase.setSnapshot([bobWallet.address]);

    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");

    const { metadata } = await dropModule.getMetadata();
    const merkles: { [key: string]: string } = metadata["merkle"];

    expect(merkles).have.property(
      "0x8969b57d06d7a724e0f4891ea35f16ce559df31e5de2ccfed80da1b7f779ef2b",
    );

    expect(merkles).have.property(
      "0x575a3a49db748c92b7cc060383de2e0ab0deace6c7c51a90393bebdb680b5be3",
    );

    const roots = (await dropModule.getAllMintConditions()).map(
      (c) => c.merkleRoot,
    );
    expect(roots).length(2);
  });

  it("should remove merkles from the metadata when claim conditions are removed", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
    ]);

    const secondPhase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await secondPhase.setSnapshot([bobWallet.address]);

    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");

    const { metadata } = await dropModule.getMetadata();
    const merkles: { [key: string]: string } = metadata["merkle"];

    expect(merkles).have.property(
      "0x8969b57d06d7a724e0f4891ea35f16ce559df31e5de2ccfed80da1b7f779ef2b",
    );

    expect(merkles).have.property(
      "0x575a3a49db748c92b7cc060383de2e0ab0deace6c7c51a90393bebdb680b5be3",
    );

    const roots = (await dropModule.getAllMintConditions()).map(
      (c) => c.merkleRoot,
    );
    expect(roots).length(2);

    const newFactory = dropModule.getMintConditionsFactory();
    newFactory.newClaimPhase({
      startTime: new Date(),
    });
    await dropModule.setMintConditions(newFactory);
    const { metadata: newMetadata } = await dropModule.getMetadata();
    const newMerkles: { [key: string]: string } = newMetadata["merkle"];
    expect(JSON.stringify(newMerkles)).to.eq("{}");
  });
});
