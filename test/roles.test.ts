import * as chai from "chai";
import { AppModule, RolesMap, ThirdwebSDK } from "../src/index";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("App Module", async () => {
  let sdk: ThirdwebSDK;
  let appModule: AppModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(RPC_URL, {
      ipfsGatewayUrl: "https://ipfs.io/ipfs/",
    });

    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */
    appModule = sdk.getAppModule("0xA47220197e8c7F7ec462989Ca992b706747B77A8");
  });

  it("should return all assigned roles", async () => {
    /**
     * This wallet owns only one token in the collection (that contains 6 tokens)
     */
    const roles = await appModule.getRoleMembers(RolesMap["admin"]);
    chai.assert.include(
      roles,
      "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
      "The app module should have a default admin",
    );
  });

  it("should override current roles in the contract", async () => {
    const roles = await appModule.getRoleMembers(RolesMap["admin"]);
    if (roles.length === 1) {
      console.log(
        await appModule.setAllRoleMembers({
          admin: [
            "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
            "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
          ],
        }),
      );
      chai.assert.lengthOf(
        await appModule.getRoleMembers(RolesMap["admin"]),
        2,
        await (await appModule.getRoleMembers(RolesMap["admin"])).toString(),
      );
    }
    if (roles.length > 1) {
      console.log(
        await appModule.setAllRoleMembers({
          admin: ["0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803"],
        }),
      );
      chai.assert.lengthOf(
        await appModule.getRoleMembers(RolesMap["admin"]),
        1,
      );
    }
  });
});
