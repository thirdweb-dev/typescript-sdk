import { sdk, signers, storage } from "./before.test";
import { readFileSync } from "fs";
import { expect } from "chai";
import { extractFunctions, extractFunctionsFromAbi, ThirdwebSDK } from "../src";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { isBooleanObject } from "util/types";
import exp = require("constants");

global.fetch = require("node-fetch");

export const uploadContractMetadata = async (filename) => {
  const greeterJson = JSON.parse(readFileSync(filename, "utf-8"));
  const abi = greeterJson.abi;
  const bytecode = greeterJson.bytecode;
  const abiUri = await storage.uploadMetadata(abi);
  const bytecodeUri = await storage.upload(bytecode);
  const contractData = {
    name: greeterJson.contractName,
    abiUri,
    bytecodeUri,
  };
  return await storage.uploadMetadata(contractData);
};

describe("Publishing", async () => {
  let simpleContractUri: string;
  let contructorParamsContractUri: string;
  let adminWallet: SignerWithAddress;
  let samWallet: SignerWithAddress;
  let bobWallet: SignerWithAddress;

  before("Upload abis", async () => {
    [adminWallet, samWallet, bobWallet] = signers;
    simpleContractUri = await uploadContractMetadata("test/abis/greeter.json");
    contructorParamsContractUri = await uploadContractMetadata(
      "test/abis/constructor_params.json",
    );
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
  });

  it("should extract functions", async () => {
    const functions = await sdk.publisher.extractFunctions(simpleContractUri);
    console.log(functions);
    expect(functions.length).gt(0);
  });

  it("should publish simple greeter contract", async () => {
    const tx = await sdk.publisher.publish(simpleContractUri);
    const contract = await tx.data();
    const deployedAddr = await sdk.publisher.deployCustomContract(
      adminWallet.address,
      contract.id,
      [],
      {
        name: "CustomContract",
      },
    );
    console.log("deployed", deployedAddr);
    expect(deployedAddr.length).to.be.gt(0);
    const all = await sdk.publisher.getAll(adminWallet.address);
    expect(all.length).to.be.eq(1);
    // fetch metadata back
    const c = await sdk.unstable_getCustomContract(deployedAddr);
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("CustomContract");
  });

  it("should publish multiple versions", async () => {
    sdk.updateSignerOrProvider(samWallet);
    let id = "";
    for (let i = 0; i < 5; i++) {
      const tx = await sdk.publisher.publish(simpleContractUri);
      id = (await tx.data()).id;
    }
    const all = await sdk.publisher.getAll(samWallet.address);
    const versions = await sdk.publisher.getAllVersions(samWallet.address, id);
    expect(all.length).to.be.eq(1);
    expect(versions.length).to.be.eq(5);
    expect(all[all.length - 1] === versions[versions.length - 1]);
  });

  it("should publish constructor params contract", async () => {
    sdk.updateSignerOrProvider(bobWallet);
    const tx = await sdk.publisher.publish(contructorParamsContractUri);
    const contract = await tx.data();
    const deployedAddr = await sdk.publisher.deployCustomContract(
      bobWallet.address,
      contract.id,
      ["someUri", 12345],
    );
    console.log("deployed", deployedAddr);
    expect(deployedAddr.length).to.be.gt(0);
    const all = await sdk.publisher.getAll(bobWallet.address);
    expect(all.length).to.be.eq(1);
  });

  it("Ethrone real ipfs test", async () => {
    const realSDK = new ThirdwebSDK(adminWallet);
    const ipfsUri = "ipfs://QmQNppFfEg3sxHh6vnYnv7KCBCFWNPFQF6evPWQeV2qHwZ/0";
    const tx = await realSDK.publisher.publish(ipfsUri);
    const contract = await tx.data();
    console.log("deployed", contract);
    const deployedAddr = await realSDK.publisher.deployCustomContract(
      adminWallet.address,
      contract.id,
      [60000, 3, 100000],
    );
    console.log("deployed", deployedAddr);
  });

  it("ERC721A real ipfs test", async () => {
    const realSDK = new ThirdwebSDK(adminWallet);
    const ipfsUri = "ipfs://QmRzD8TEYrd4Ux7ZNTBKWbuAERn6rvfUzo1nnW3GMtFL8h/0";
    const tx = await realSDK.publisher.publish(ipfsUri);
    const contract = await tx.data();
    console.log("deployed", await contract);
    const deployedAddr = await realSDK.publisher.deployCustomContract(
      adminWallet.address,
      contract.id,
      ["foo", "bar"],
    );
    console.log("deployed", deployedAddr);
  });
});
