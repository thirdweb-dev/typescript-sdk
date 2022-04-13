import { sdk, signers, storage } from "./before.test";
import { readFileSync } from "fs";
import { expect } from "chai";
import { ThirdwebSDK } from "../src";
import { AddressZero } from "@ethersproject/constants";

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

  before("Upload abis", async () => {
    simpleContractUri = await uploadContractMetadata("test/abis/greeter.json");
    contructorParamsContractUri = await uploadContractMetadata(
      "test/abis/constructor_params.json",
    );
  });

  it("should publish simple greeter contract", async () => {
    const publisherAddress = await sdk.getSigner().getAddress();
    const tx = await sdk.publisher.publish(simpleContractUri);
    const deployedAddr = await sdk.publisher.deployCustomContract(
      publisherAddress,
      tx.id,
      [],
      {
        name: "CustomContract",
      },
    );
    console.log("deployed", deployedAddr);
    expect(deployedAddr.length).to.be.gt(0);
    const addr = (await sdk.getSigner()?.getAddress()) || "";
    const all = await sdk.publisher.getAll(addr);
    expect(all.length).to.be.eq(1);
    // fetch metadata back
    const c = await sdk.unstable_getCustomContract(deployedAddr);
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("CustomContract");
  });

  it("should publish constructor params contract", async () => {
    const publisherAddress = await sdk.getSigner().getAddress();
    const tx = await sdk.publisher.publish(contructorParamsContractUri);
    const deployedAddr = await sdk.publisher.deployCustomContract(
      publisherAddress,
      tx.id,
      ["someUri", 12345],
    );
    console.log("deployed", deployedAddr);
    expect(deployedAddr.length).to.be.gt(0);
    const addr = (await sdk.getSigner()?.getAddress()) || "";
    const all = await sdk.publisher.getAll(addr);
    expect(all.length).to.be.eq(2);
  });

  it("Ethrone real ipfs test", async () => {
    const [signer] = signers;
    const realSDK = new ThirdwebSDK(signer);
    const publisherAddress =
      (await realSDK.getSigner()?.getAddress()) || AddressZero;
    const ipfsUri = "ipfs://QmQNppFfEg3sxHh6vnYnv7KCBCFWNPFQF6evPWQeV2qHwZ/0";
    const tx = await realSDK.publisher.publish(ipfsUri);
    console.log("deployed", await tx.data());
    const deployedAddr = await realSDK.publisher.deployCustomContract(
      publisherAddress,
      tx.id,
      [60000, 3, 100000],
    );
    console.log("deployed", deployedAddr);
  });

  it("ERC721A real ipfs test", async () => {
    const [signer] = signers;
    const realSDK = new ThirdwebSDK(signer);
    const publisherAddress =
      (await realSDK.getSigner()?.getAddress()) || AddressZero;
    const ipfsUri = "ipfs://QmRzD8TEYrd4Ux7ZNTBKWbuAERn6rvfUzo1nnW3GMtFL8h/0";
    const tx = await realSDK.publisher.publish(ipfsUri);
    console.log("deployed", await tx.data());
    const deployedAddr = await realSDK.publisher.deployCustomContract(
      publisherAddress,
      tx.id,
      ["foo", "bar"],
    );
    console.log("deployed", deployedAddr);
  });
});
