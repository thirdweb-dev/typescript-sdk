import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RolesMap } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Roles Module", async () => {
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
  });

  it("should return all assigned roles", async () => {
    /**
     * This wallet owns only one token in the collection (that contains 6 tokens)
     */
    const roles = await appModule.getRoleMembers(RolesMap["admin"]);
    assert.include(
      roles,
      adminWallet.address,
      "The app module should have a default admin",
    );
  });
});
