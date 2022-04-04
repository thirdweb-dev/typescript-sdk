import { ethers, Wallet } from "ethers";
import { sdk } from "./before.test";
import { EventType } from "../src/constants/events";
import { expect } from "chai";
import { NFTDrop, ThirdwebSDK } from "../src";
import { AddressZero } from "@ethersproject/constants";

global.fetch = require("node-fetch");

describe("Publishing", async () => {
  // TODO pre-upload a bunch of ABIs to mock storage

  it("should fetch published contracts", async () => {
    const addr = (await sdk.getSigner()?.getAddress()) || "";
    const all = await sdk.publisher.getAll(addr);
    console.log(all);
  });

  it("should publish contracts", async () => {
    const metadataUri =
      "ipfs://QmZHuLgpMh73k4SdnF7bjZM4q3pzX6kV5zGvPdqjtLeciF/0";
    const tx = await sdk.publisher.publish(metadataUri);
    console.log("publish id", tx.id);
    const published = await tx.data();
    console.log("published struct", published);
    const deployedAddr = await sdk.publisher.deployCustomContract(
      published,
      [],
    );
    console.log("deployed", deployedAddr);
  });

  // TODO test contract with constructor params
});
