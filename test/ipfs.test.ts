import * as chai from "chai";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { ThirdwebSDK, uploadMetadata } from "../src/index";

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
            image: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
          },
        },
      });

      chai.assert.equal(
        upload,
        "ipfs://bafkreidb4a4h3xg2ju6y3bmkp27ruottvf4gfmjccbtyj5hfk3uypftidu",
      );
    } catch (err) {
      chai.assert.fail(err);
    }
  });

  it("should not upload the string to IPFS", async () => {
    const upload = await uploadMetadata({
      image:
        "ipfs://QmZsU8nTTexTxPzCKZKqo3Ntf5cUiWMRahoLmtpimeaCiT/face_parts/Asset%20331.svg",
    });
    chai.assert.equal(
      upload,
      "ipfs://bafkreifivlt2emsugvh7pbeluwneqtkxebn73qytd7ulsipsgzrkk2liiy",
    );
  });

  it("should upload an MP4 file when passed in the animation_url property", async () => {
    const upload = await uploadMetadata({
      animation_url: readFileSync("test/test.mp4"),
    });
    chai.assert.equal(
      upload,
      "ipfs://bafkreih6i5vu3ods5zz3c7j3f6ad5nt7fkoamsmbxpypl54zwdm4vsu4ju",
    );
  });
});
