import * as chai from "chai";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { ThirdwebSDK, uploadMetadata } from "../src/index";

global.fetch = require("node-fetch");

describe("IPFS Uploads", async () => {
  let sdk: ThirdwebSDK;

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
  });
  async function getFile(upload): Promise<Response> {
    const response = await fetch(
      `https://cloudflare-ipfs.com/ipfs/${upload.replace("ipfs://", "")}`,
    )
      .then(async (res) => {
        return res;
      })
      .catch((e) => {
        chai.assert.fail(e);
      });
    return response;
  }
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
      const data = await (await getFile(upload)).json();
      const uploadTest = await (await getFile(data.test.test.image)).headers
        .get("content-type")
        .toString();

      chai.assert.equal(uploadTest, "image/jpeg");
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
