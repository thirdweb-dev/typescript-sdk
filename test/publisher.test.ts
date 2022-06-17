import { signers } from "./before-setup";
import { readFileSync } from "fs";
import { expect } from "chai";
import { ChainId, IpfsStorage, isFeatureEnabled, ThirdwebSDK } from "../src";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import invariant from "tiny-invariant";
import { DropERC721__factory, TokenERC721__factory } from "../typechain";
import { ethers } from "ethers";

global.fetch = require("cross-fetch");

export const uploadContractMetadata = async (
  contractName: string,
  storage: IpfsStorage,
) => {
  const buildinfo = JSON.parse(
    readFileSync("test/test_abis/hardhat-build-info.json", "utf-8"),
  );
  const info =
    buildinfo.output.contracts[`contracts/${contractName}.sol`][contractName];
  const bytecode = `0x${info.evm.bytecode.object}`;
  const metadataUri = await storage.uploadSingle(info.metadata);
  const bytecodeUri = await storage.uploadSingle(bytecode);
  const model = {
    name: contractName,
    metadataUri: `ipfs://${metadataUri}`,
    bytecodeUri: `ipfs://${bytecodeUri}`,
  };
  return await storage.uploadMetadata(model);
};

describe("Publishing", async () => {
  let simpleContractUri: string;
  let contructorParamsContractUri: string;
  let adminWallet: SignerWithAddress;
  let samWallet: SignerWithAddress;
  let bobWallet: SignerWithAddress;
  let sdk: ThirdwebSDK;
  let storage: IpfsStorage;

  before("Upload abis", async () => {
    [adminWallet, samWallet, bobWallet] = signers;
    sdk = ThirdwebSDK.fromSigner(adminWallet, ChainId.Hardhat);
    storage = new IpfsStorage();
    simpleContractUri = await uploadContractMetadata("Greeter", storage);
    contructorParamsContractUri = await uploadContractMetadata(
      "ConstructorParams",
      storage,
    );
  });

  beforeEach(async () => {
    sdk.wallet.connect(adminWallet);
  });

  it("should extract functions", async () => {
    const publisher = sdk.getPublisher();
    const functions = await publisher.extractFunctions(simpleContractUri);
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
    const publisher = sdk.getPublisher();
    const tx = await publisher.publish(simpleContractUri);
    const contract = await tx.data();
    const deployedAddr = await publisher.deployPublishedContract(
      adminWallet.address,
      contract.id,
      [],
    );
    expect(deployedAddr.length).to.be.gt(0);
    const all = await publisher.getAll(adminWallet.address);
    expect(all.length).to.be.eq(1);
    // fetch metadata back
    const c = await sdk.getContract(deployedAddr);
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("Greeter");
  });

  it("should publish multiple versions", async () => {
    sdk.wallet.connect(samWallet);
    const publisher = sdk.getPublisher();
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
    sdk.wallet.connect(bobWallet);
    const publisher = sdk.getPublisher();
    const tx = await publisher.publish(contructorParamsContractUri);
    const contract = await tx.data();
    const deployedAddr = await publisher.deployPublishedContract(
      bobWallet.address,
      contract.id,
      [
        adminWallet.address,
        "0x1234",
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
    const publisher = sdk.getPublisher();
    const tx = await publisher.publishBatch([
      simpleContractUri,
      contructorParamsContractUri,
    ]);
    expect(tx.length).to.eq(2);
    expect((await tx[0].data()).id).to.eq("Greeter");
    expect((await tx[1].data()).id).to.eq("ConstructorParams");
  });

  it("SimpleAzuki enumerable", async () => {
    const realSDK = ThirdwebSDK.fromSigner(adminWallet, ChainId.Hardhat);
    const pub = await realSDK.getPublisher();
    const ipfsUri = "ipfs://QmTKKUUEU6GnG7VEEAAXpveeirREC1JNYntVJGhHKhqcYZ/0";
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
    const realSDK = ThirdwebSDK.fromSigner(adminWallet, ChainId.Hardhat);
    const pub = await realSDK.getPublisher();
    const ipfsUri = "ipfs://QmPPPoKk2mwoxBVTW5qMMNwaV4Ja5qDoq7fFZNFFvr3YsW/1";
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
    invariant(c.royalties, "no royalties detected");
    await c.metadata.set({
      name: "Hello",
    });
    const meta = await c.metadata.get();
    expect(meta.name).to.eq("Hello");
  });

  it("ERC721Dropable feature detection", async () => {
    const realSDK = ThirdwebSDK.fromSigner(adminWallet, ChainId.Hardhat);
    const pub = realSDK.getPublisher();
    const ipfsUri = "ipfs://QmWaidQMSYHPzYYZCxMc2nSk2vrD28mS43Xc9k7QFyAGja/0";
    const addr = await pub.deployContract(ipfsUri, []);
    const c = await realSDK.getContract(addr);

    invariant(c.nft, "nft must be defined");
    invariant(c.nft.drop, "drop must be defined");
    invariant(c.nft.drop.claimConditions, "claim conditions must be defined");

    let claimConditions = await c.nft.drop.claimConditions.getAll();
    expect(claimConditions.length).to.equal(0);

    await c.nft.drop.claimConditions.set([
      {
        price: "0",
        startTime: new Date(0),
      },
      {
        price: "0",
        startTime: new Date(),
      },
    ]);

    claimConditions = await c.nft.drop.claimConditions.getAll();
    expect(claimConditions.length).to.equal(2);
  });

  it("Constructor params with tuples", async () => {
    const realSDK = ThirdwebSDK.fromSigner(adminWallet, ChainId.Hardhat);
    const pub = await realSDK.getPublisher();
    const ipfsUri = "ipfs://QmZQa56Cj1gFnZgKSkvGE5uzhaQrQV3nU6upDWDusCaCwY/0";
    const addr = await pub.deployContract(ipfsUri, [
      "0x1234",
      "123",
      JSON.stringify(["0x1234", "0x4567"]),
      JSON.stringify([
        213,
        ethers.utils.hexZeroPad("0x1234", 32),
        [adminWallet.address, samWallet.address],
      ]),
    ]);
    const c = await sdk.getContract(addr);
    const uri = await c.call("contractUri");
    expect(uri).to.eq(ethers.utils.hexZeroPad("0x1234", 32));

    const tx = await c.call("updateStruct", {
      aNumber: 123,
      aString: ethers.utils.hexZeroPad("0x1234", 32),
      anArray: [adminWallet.address, samWallet.address],
    });
    expect(tx).to.not.eq(undefined);
  });
});
