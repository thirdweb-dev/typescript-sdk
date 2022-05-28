import { sdk, signers, storage } from "./before-setup";
import { readFileSync } from "fs";
import { expect } from "chai";
import { isFeatureEnabled, ThirdwebSDK } from "../src";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import invariant from "tiny-invariant";
import { DropERC721__factory, TokenERC721__factory } from "../typechain";

global.fetch = require("cross-fetch");

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
    const publisher = await sdk.getPublisher();
    const functions = await publisher.extractFunctions(simpleContractUri);
    console.log(functions);
    expect(functions.length).gt(0);
  });

  it("should extract features", async () => {
    expect(
      isFeatureEnabled(TokenERC721__factory.abi, "ERC721Enumerable"),
    ).to.eq(true);
    expect(isFeatureEnabled(TokenERC721__factory.abi, "ERC721Mintable")).to.eq(
      true,
    );
    expect(
      isFeatureEnabled(TokenERC721__factory.abi, "ERC721BatchMintable"),
    ).to.eq(true);

    // Drop
    expect(isFeatureEnabled(DropERC721__factory.abi, "ERC721Enumerable")).to.eq(
      true,
    );
    expect(isFeatureEnabled(DropERC721__factory.abi, "ERC721Supply")).to.eq(
      true,
    );
    expect(isFeatureEnabled(DropERC721__factory.abi, "ERC721Mintable")).to.eq(
      false,
    );
  });

  it("should publish simple greeter contract", async () => {
    const publisher = await sdk.getPublisher();
    const tx = await publisher.publish(simpleContractUri);
    const contract = await tx.data();
    const deployedAddr = await publisher.deployPublishedContract(
      adminWallet.address,
      contract.id,
      [],
      {
        name: "CustomContract",
      },
    );
    expect(deployedAddr.length).to.be.gt(0);
    const all = await publisher.getAll(adminWallet.address);
    expect(all.length).to.be.eq(1);
    // fetch metadata back
    const c = await sdk.getContract(deployedAddr);
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("CustomContract");
  });

  it("should publish multiple versions", async () => {
    sdk.updateSignerOrProvider(samWallet);
    const publisher = await sdk.getPublisher();
    let id = "";
    for (let i = 0; i < 5; i++) {
      const tx = await publisher.publish(simpleContractUri);
      id = (await tx.data()).id;
    }
    const all = await publisher.getAll(samWallet.address);
    const versions = await publisher.getAllVersions(samWallet.address, id);
    expect(all.length).to.be.eq(1);
    expect(versions.length).to.be.eq(5);
    expect(all[all.length - 1] === versions[versions.length - 1]);
  });

  it("should publish constructor params contract", async () => {
    sdk.updateSignerOrProvider(bobWallet);
    const publisher = await sdk.getPublisher();
    const tx = await publisher.publish(contructorParamsContractUri);
    const contract = await tx.data();
    const deployedAddr = await publisher.deployPublishedContract(
      bobWallet.address,
      contract.id,
      [
        adminWallet.address,
        "someUri",
        12345,
        [adminWallet.address, samWallet.address],
        [12, 23, 45],
      ],
    );
    expect(deployedAddr.length).to.be.gt(0);
    const all = await publisher.getAll(bobWallet.address);
    expect(all.length).to.be.eq(1);
  });

  it("should publish batch contracts", async () => {
    const publisher = await sdk.getPublisher();
    const tx = await publisher.publishBatch([
      simpleContractUri,
      contructorParamsContractUri,
    ]);
    expect(tx.length).to.eq(2);
    expect((await tx[0].data()).id).to.eq("Greeter");
    expect((await tx[1].data()).id).to.eq("ConstructorParams");
  });

  it("SimpleAzuki enumerable", async () => {
    const realSDK = new ThirdwebSDK(adminWallet);
    const pub = await realSDK.getPublisher();
    const ipfsUri = "ipfs://QmPoEDD6EdjMZ6U5pDdLbZnLhcNuMzyEFFEMVqVDw5JAJX/0";
    const tx = await pub.publish(ipfsUri);
    const contract = await tx.data();
    const deployedAddr = await pub.deployPublishedContract(
      adminWallet.address,
      contract.id,
      [],
    );
    const c = await realSDK.getContract(deployedAddr);
    invariant(c.nft, "no nft detected");
    invariant(c.nft.query, "no nft query detected");
    const all = await c.nft.query.all();
    expect(all.length).to.eq(0);
  });

  it("AzukiWithMinting mintable", async () => {
    const realSDK = new ThirdwebSDK(adminWallet);
    const pub = await realSDK.getPublisher();
    const ipfsUri = "ipfs://QmPoEDD6EdjMZ6U5pDdLbZnLhcNuMzyEFFEMVqVDw5JAJX/1";
    const tx = await pub.publish(ipfsUri);
    const contract = await tx.data();
    const deployedAddr = await pub.deployPublishedContract(
      adminWallet.address,
      contract.id,
      [10, "bar"],
    );
    const c = await realSDK.getContract(deployedAddr);
    invariant(c.nft, "no nft detected");
    invariant(c.nft.mint, "no minter detected");
    const tx2 = await c.nft.mint.to(adminWallet.address, {
      name: "cool nft",
    });
    invariant(c.nft, "no nft detected");
    const nft = await c.nft.get(tx2.id);
    expect(nft.metadata.name).to.eq("cool nft");
    invariant(c.nft.query, "no nft query detected");
    const all = await c.nft.query.all();
    expect(all.length).to.eq(1);
  });
});
