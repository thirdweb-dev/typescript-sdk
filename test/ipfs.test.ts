import { AddressZero } from "@ethersproject/constants";
import * as chai from "chai";
import { ethers } from "ethers";
import { ThirdwebSDK, uploadMetadata } from "../src/index";
import {readFileSync} from "fs";

global.fetch = require("node-fetch");

describe("NFT Module", async () => {
  let sdk: ThirdwebSDK;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(
      new ethers.Wallet(
        process.env.PKEY,
        ethers.getDefaultProvider("https://rpc-mumbai.maticvigil.com"),
      ),
    );

  });



  it("should upload a file through any property, even when it is in an object nested inside another object", async () => {

    try {
      const upload = await uploadMetadata({
        name: "test",
        image: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
        test: {
          test: {
            image: readFileSync("test/3510820011_4f558b6dea_b.jpg")
          }
        }
      })
      const regex = new RegExp(/Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/);
      chai.assert.isTrue(regex.test(upload));
    } catch (err) {
      chai.assert.fail(err);
    }
  });
});
