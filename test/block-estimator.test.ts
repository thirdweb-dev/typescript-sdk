import { expect } from "chai";
import { ethers } from "ethers";
import {
  DEFAULT_BLOCK_TIMES_FALLBACK,
  estimateBlockAtTime,
} from "../src/utils";

global.fetch = require("node-fetch");

describe.skip("Block Estimator", async () => {
  beforeEach(async () => {});

  it(`should return accurate estimates`, async () => {
    const ethProvider = ethers.getDefaultProvider();
    const chainId = (await ethProvider.getNetwork()).chainId;

    const cachedTime = DEFAULT_BLOCK_TIMES_FALLBACK[chainId];

    const now = Math.floor(Date.now() / 1000);
    const estimatedBlock = await estimateBlockAtTime(now + 20, ethProvider);

    const newTime = DEFAULT_BLOCK_TIMES_FALLBACK[chainId];

    console.log(cachedTime, newTime);

    console.log(estimatedBlock);
    expect(newTime).to.not.equal(cachedTime);
  });
});
