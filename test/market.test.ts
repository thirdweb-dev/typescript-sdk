import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MarketModule,
  NFTModule,
  QuantityAboveLimitError,
  MissingOwnerRoleError,
  MissingRoleError,
} from "../src";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

describe("Market Module", async () => {
  let marketModule: MarketModule;
  let nftModule: NFTModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
    marketModule = await appModule.deployMarketModule({
      name: "Currency Module",
      marketFeeBasisPoints: 10000,
    });
    nftModule = await appModule.deployNftModule({
      name: "NFT Module",
      symbol: "NFT",
      sellerFeeBasisPoints: 10000,
    });
  });

  it("should throw MissingRoleError when trying to list without a lister role", async () => {
    sdk.setProviderOrSigner(adminWallet);
    await nftModule.mintTo(bobWallet.address, {
      name: "Test",
      description: "Test",
    });
    marketModule.setRestrictedListerRoleOnly(true);

    sdk.setProviderOrSigner(bobWallet);
    try {
      await marketModule.list(
        nftModule.address,
        "0",
        "0x0000000000000000000000000000000000000000",
        0,
        1,
        1,
      );
    } catch (e) {
      if (!(e instanceof MissingRoleError)) {
        throw e;
      }
    }
  });
  it("should throw a QuantityAboveLimitError error when trying to buy more than the tokensPerBuy specified", async () => {
    sdk.setProviderOrSigner(adminWallet);
    await nftModule.mintTo(bobWallet.address, {
      name: "Test",
      description: "Test",
    });

    sdk.setProviderOrSigner(bobWallet);
    await marketModule.list(
      nftModule.address,
      "0",
      "0x0000000000000000000000000000000000000000",
      0,
      1,
      1,
    );
    try {
      await marketModule.buy((await marketModule.getAll())[0].id, 2);
    } catch (e) {
      if (!(e instanceof QuantityAboveLimitError)) {
        throw e;
      }
    }
  });

  it("should throw a descriptive error while listing from an account which is not given the role", async () => {
    sdk.setProviderOrSigner(adminWallet);
    await nftModule.mintTo(bobWallet.address, {
      name: "Test",
      description: "Test",
    });
    await nftModule.mintTo(samWallet.address, {
      name: "Test",
      description: "Test",
    });
    sdk.setProviderOrSigner(bobWallet);
    try {
      await marketModule.list(
        nftModule.address,
        "1",
        "0x0000000000000000000000000000000000000000",
        0,
        1,
        1,
      );
    } catch (e) {
      if (!(e instanceof MissingOwnerRoleError)) {
        throw e;
      }
    }
  });
});
