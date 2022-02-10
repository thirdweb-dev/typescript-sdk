import { NewErc1155SignaturePayload } from "../src/types/signature-minting/SignaturePayload";
import { SignatureMint1155Module } from "../src/modules/signature-mint-1155";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../src/index";
import { appModule, sdk, signers } from "./before.test";
import { sign } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const keccak256 = require("keccak256");

global.fetch = require("node-fetch");

describe("SignatureMint1155 Module", async () => {
  let module: SignatureMint1155Module;
  let adminWallet,
    samWallet,
    abbyWallet,
    bobWallet,
    w1,
    w2,
    w3,
    w4: SignerWithAddress;

  beforeEach(async () => {
    [adminWallet, samWallet, bobWallet, abbyWallet, w1, w2, w3, w4] = signers;
    await sdk.setProviderOrSigner(adminWallet);
    module = await appModule.deploySignatureMint1155Module({
      name: "Test Signature Mint 1155",
      primarySaleRecipientAddress: AddressZero,
    });
  });

  it("should allow to mint normally", async () => {
    await module.createAndMint({
      metadata: {
        name: "test",
      },
      supply: 10,
    });
    const minted = await module.get("0");
    expect(minted.metadata.name).is.eq("test");
    expect(minted.supply.toNumber()).is.eq(10);
  });

  it("should allow to batch mint normally", async () => {
    await module.createAndMintBatch([
      {
        metadata: {
          name: "test1",
        },
        supply: 10,
      },
      {
        metadata: {
          name: "test2",
        },
        supply: 20,
      },
    ]);
    const all = await module.getAll();
    expect(all.length).to.eq(2);
    const minted = await module.get("0");
    expect(minted.metadata.name).is.eq("test1");
    expect(minted.supply.toNumber()).is.eq(10);
    const minted2 = await module.get("1");
    expect(minted2.metadata.name).is.eq("test2");
    expect(minted2.supply.toNumber()).is.eq(20);
  });

  describe("signature minting", () => {
    let defaultPayload: NewErc1155SignaturePayload;

    beforeEach(async () => {
      defaultPayload = {
        tokenId: ethers.constants.MaxUint256,
        quantity: 10,
        price: ethers.utils.parseEther("0.001"),
        metadata: {
          name: "test",
        },
        to: samWallet.address,
        currencyAddress: NATIVE_TOKEN_ADDRESS,
        mintStartTimeEpochSeconds: 0,
        mintEndTimeEpochSeconds: ethers.BigNumber.from(
          "0xffffffffffffffffffffffffffffffff",
        ),
      };
    });

    it("should be able to mint with signature", async () => {
      const { payload, signature } = await module.generateSignature(
        defaultPayload,
      );
      expect(payload.quantity).to.eq(10);
      expect(signature.length).to.be.above(0);

      const mintedId = await module.mintWithSignature(payload, signature);
      expect(mintedId.toNumber()).to.eq(0);
      const minted = await module.get("0");
      expect(minted.metadata.name).is.eq("test");
    });

    it("should be able verify a signature", async () => {
      const { payload, signature } = await module.generateSignature(
        defaultPayload,
      );
      expect(await module.verify(payload, signature)).to.eq(true);
    });
  });
});
