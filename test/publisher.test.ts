import { BigNumber, ethers } from "ethers";
import { sdk, signers, storage } from "./before.test";
import { readFileSync } from "fs";
import exp = require("constants");
import { expect } from "chai";
import { ThirdwebSDK } from "../src";

global.fetch = require("node-fetch");

describe("Publishing", async () => {
  let simpleContractUri: string;
  let contructorParamsContractUri: string;

  const uploadContractMetadata = async (filename) => {
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

  before("Upload abis", async () => {
    simpleContractUri = await uploadContractMetadata("test/abis/greeter.json");
    contructorParamsContractUri = await uploadContractMetadata(
      "test/abis/constructor_params.json",
    );
  });

  it("should publish simple greeter contract", async () => {
    const tx = await sdk.publisher.publish(simpleContractUri);
    const published = await tx.data();
    const deployedAddr = await sdk.publisher.deployCustomContract(
      published,
      [],
    );
    console.log("deployed", deployedAddr);
    expect(deployedAddr.length).to.be.gt(0);
    const addr = (await sdk.getSigner()?.getAddress()) || "";
    const all = await sdk.publisher.getAll(addr);
    expect(all.length).to.be.eq(1);
  });

  it("should publish constructor params contract", async () => {
    const tx = await sdk.publisher.publish(contructorParamsContractUri);
    const published = await tx.data();
    const deployedAddr = await sdk.publisher.deployCustomContract(published, [
      ethers.utils.formatBytes32String("someUri"),
      BigNumber.from(12345),
    ]);
    console.log("deployed", deployedAddr);
    expect(deployedAddr.length).to.be.gt(0);
    const addr = (await sdk.getSigner()?.getAddress()) || "";
    const all = await sdk.publisher.getAll(addr);
    expect(all.length).to.be.eq(2);
  });

  /**
  it("real ipfs test", async () => {
    const [signer] = signers;
    const realSDK = new ThirdwebSDK(signer);
    const ipfsUri = "ipfs://QmTnJPnz83Pv8CZqTGTCvu44kSY6WcXL5G32cVCso971FH/0";
    const tx = await realSDK.publisher.publish(ipfsUri);
    console.log("deployed", await tx.data());
    const published = await realSDK.publisher.get(
      await realSDK.getSigner().getAddress(),
      ipfsUri,
    );
    const deployedAddr = await realSDK.publisher.deployCustomContract(
      published,
      [3600, 3, ethers.utils.parseUnits("0.01")],
    );
    console.log("deployed", deployedAddr);
  });
   **/
});
