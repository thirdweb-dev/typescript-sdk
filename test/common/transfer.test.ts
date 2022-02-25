import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { appModule, sdk, signers } from "../before.test";
import { RestrictedTransferError } from "../../src/common/error";

describe("ITransferable", async () => {
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet] = signers;
    await sdk.setProviderOrSigner(adminWallet);
  });

  it("should restrict token transfers", async () => {
    const tokenModule = await appModule.deployTokenModule({
      name: "Token Module",
      symbol: "TKN",
    });

    await tokenModule.mintTo(samWallet.address, 100000000);
    await tokenModule.setRestrictedTransfer(true);
    const isRestricted = await tokenModule.isTransferRestricted();
    assert.isTrue(isRestricted);

    try {
      await sdk.setProviderOrSigner(samWallet);
      await tokenModule.transfer(bobWallet.address, 1000);
    } catch (err) {
      console.log(err);
      if ((err as Error).message.includes("Transfers are restricted")) {
        return;
      }
      throw err;
    }
  });

  it("should restrict nft transfers", async () => {
    const module = await appModule.deployNftModule({
      name: "Nft Module",
      sellerFeeBasisPoints: 100,
    });

    const nft = await module.mint({ name: "test" });

    await module.setRestrictedTransfer(true);
    const isRestricted = await module.isTransferRestricted();
    assert.isTrue(isRestricted);

    try {
      await module.transfer(bobWallet.address, nft.id);
    } catch (err) {
      if (err instanceof RestrictedTransferError) {
        return;
      }
      throw err;
    }
  });

  it("should restrict bundle transfers", async () => {
    const module = await appModule.deployBundleModule({
      name: "Bundle Module",
      sellerFeeBasisPoints: 100,
    });

    await module.createAndMint({
      metadata: { name: "test" },
      supply: 100,
    });

    await module.setRestrictedTransfer(true);
    const isRestricted = await module.isTransferRestricted();
    assert.isTrue(isRestricted);

    try {
      await module.transfer(bobWallet.address, "0", 1);
    } catch (err) {
      if (err instanceof RestrictedTransferError) {
        return;
      }
      throw err;
    }
  });
});
