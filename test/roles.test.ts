import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFTModule, RolesMap } from "../src/index";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";

global.fetch = require("node-fetch");

describe("Roles Module", async () => {
  let nftModule: NFTModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);

    nftModule = sdk.getNFTModule(
      await appModule
        .deployNftModule({
          name: "NFT Module",
          sellerFeeBasisPoints: 1000,
        })
        .then((m) => m.address),
    );
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

  /**
   * Add multiple roles - 0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E gets pauser and transfer
   *
   * Remove multiple roles - 0x553C5E856801b5876e80D32a192086b2035286C1 is revoked from pauser and transfer
   *
   * Replace all roles - for minter, 0x553C5E856801b5876e80D32a192086b2035286C1 is removed and 0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803 is added
   *
   */

  it("should override current roles in the contract", async () => {
    await nftModule.setAllRoleMembers({
      admin: [adminWallet.address],
      minter: [
        "0x553C5E856801b5876e80D32a192086b2035286C1",
        "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
      ],
      pauser: ["0x553C5E856801b5876e80D32a192086b2035286C1"],
      transfer: ["0x553C5E856801b5876e80D32a192086b2035286C1"],
    });

    const newRoles = await nftModule.getAllRoleMembers();
    assert.isTrue(
      newRoles.admin.length === 1 &&
        newRoles.admin.includes(adminWallet.address),
    );
    assert.isTrue(
      newRoles.minter.length === 2 &&
        newRoles.minter.includes(
          "0x553C5E856801b5876e80D32a192086b2035286C1",
        ) &&
        newRoles.minter.includes("0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"),
    );
    assert.isTrue(
      newRoles.pauser.length === 1 &&
        newRoles.pauser.includes("0x553C5E856801b5876e80D32a192086b2035286C1"),
    );
    assert.isTrue(
      newRoles.transfer.length === 1 &&
        newRoles.transfer.includes(
          "0x553C5E856801b5876e80D32a192086b2035286C1",
        ),
    );
  });

  it("Replace all roles - confirm that all roles were replaced (not just added)", async () => {
    await nftModule.setAllRoleMembers({
      admin: [
        adminWallet.address,
        "0x553C5E856801b5876e80D32a192086b2035286C1",
      ],
      minter: [
        "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
        "0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803",
      ],
      pauser: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
      transfer: ["0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"],
    });
    const newRoles = await nftModule.getAllRoleMembers();
    assert.isTrue(
      newRoles.admin.length === 2 &&
        newRoles.admin.includes(adminWallet.address) &&
        newRoles.admin.includes("0x553C5E856801b5876e80D32a192086b2035286C1"),
    );
    assert.isTrue(
      newRoles.minter.length === 2 &&
        newRoles.minter.includes(
          "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
        ) &&
        newRoles.minter.includes("0xE79ee09bD47F4F5381dbbACaCff2040f2FbC5803"),
    );
    assert.isTrue(
      newRoles.pauser.length === 1 &&
        newRoles.pauser.includes("0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E"),
    );
    assert.isTrue(
      newRoles.transfer.length === 1 &&
        newRoles.transfer.includes(
          "0xf16851cb58F3b3881e6bdAD21f57144E9aCf602E",
        ),
    );
  });
});
