import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { DropModule } from "../src/index";
import { appModule, signers } from "./before.test";

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
      startTime: new Date().getTime() / 2000,
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
    await dropModule.setClaimConditions(factory);
    console.log("Claim condition set");

    const { metadata } = await dropModule.getMetadata();
    const merkles: { [key: string]: string } = metadata["merkle"];

    expect(merkles).have.property(
      "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164",
    );

    expect(merkles).have.property(
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
    );

    const roots = (await dropModule.getAllMintConditions()).map(
      (c) => c.merkleRoot,
    );
    expect(roots).length(2);
  });

  it.skip("should remove merkles from the metadata when claim conditions are removed", async () => {
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

  it("test that someone in the merkle tree can successfully claim", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
      "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
    ]);
    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");
    console.log("Minting");
    await dropModule.lazyMintAmount(1);
    console.log("Minted");
    console.log("Claiming");
    await dropModule.claim(1);
    console.log("Claimed");
  });

  it.skip("should not allow claiming to someone not in the merkle tree", async () => {
    const factory = dropModule.getMintConditionsFactory();
    const phase = factory.newClaimPhase({
      startTime: new Date(),
    });
    await phase.setSnapshot([
      bobWallet.address,
      samWallet.address,
      abbyWallet.address,
    ]);
    console.log("Setting claim condition");
    await dropModule.setMintConditions(factory);
    console.log("Claim condition set");
    console.log("Minting");
    await dropModule.lazyMintAmount(1);
    console.log("Minted");
    console.log("Claiming");
    try {
      await dropModule.claim(1);
    } catch {
      console.log("Could not claim!");
      return;
    }
    throw new Error("Claimed to someone not in the merkle tree");
  });

  it.skip("test that a regular claim with no merkle root works as expected", async () => {
    dropModule.lazyMintAmount(1);
    dropModule.claim(1);
  });
});
