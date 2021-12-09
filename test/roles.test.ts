import * as chai from "chai";
import { AppModule, NFTModule, RolesMap, ThirdwebSDK } from "../src/index";
import { ethers } from "ethers";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("App Module", async () => {
  let sdk: ThirdwebSDK;
  let appModule: AppModule;
  let nftModule: NFTModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(
        process.env.PKEY,
        ethers.getDefaultProvider("https://rpc-mumbai.maticvigil.com"),
      ),
      {
        ipfsGatewayUrl: "https://ipfs.io/ipfs/",
      },
    );

    /**
     * This contract address *should* exist forever on mumbai
     * It contains some test data with burned tokens and some tokens owned by
     * the test address starting with 0xE79
     */
    appModule = sdk.getAppModule("0xA47220197e8c7F7ec462989Ca992b706747B77A8");
    nftModule = sdk.getNFTModule("0x364A9b8f4382bB583C3833E484A44f7A189312a7");
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

  /**
   * Add multiple roles - confirm that missing roles were added
   *
   * Remove multiple roles - confirm that selected roles were removed
   *
   * Replace all roles - confirm that all roles were replaced (not just added)
   *
   * - 1,2,3,4,5
   * - 3,4,5,6,7
   */

  it("should override current roles in the contract", async () => {
    await nftModule.setAllRoleMembers({
      admin: ["0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803"],
      minter: [
        "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
        "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
      ],
      pauser: ["0x553C5E856801b5876e80D32a192086b2035286C1"],
      transfer: [],
    });
    chai.assert.isTrue(
      (await nftModule.getAllRoleMembers()) ===
        {
          admin: ["0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803"],
          minter: [
            "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
            "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
          ],
          pauser: ["0x553C5E856801b5876e80D32a192086b2035286C1"],
          transfer: [],
        },
    );
  });

  it("Replace all roles - confirm that all roles were replaced (not just added)", async () => {
    await nftModule.setAllRoleMembers({
      admin: [
        "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
        "0x553C5E856801b5876e80D32a192086b2035286C1",
      ],
      minter: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
      pauser: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
      transfer: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
    });
    chai.assert.isTrue(
      (await nftModule.getAllRoleMembers()) ===
        {
          admin: [
            "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
            "0x553C5E856801b5876e80D32a192086b2035286C1",
          ],
          minter: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
          pauser: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
          transfer: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
        },
    );
  });
});
