import * as chai from "chai";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { ThirdwebSDK } from "../src/index";

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

  async function getFile(upload: string): Promise<Response> {
    const response = await fetch(
      `https://nftlabs.mypinata.cloud/ipfs/${upload.replace("ipfs://", "")}`,
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
      const upload = await sdk.getStorage().uploadMetadata({
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
    const upload = await sdk.getStorage().uploadMetadata({
      image:
        "ipfs://QmZsU8nTTexTxPzCKZKqo3Ntf5cUiWMRahoLmtpimeaCiT/face_parts/Asset%20331.svg",
    });
    chai.assert.equal(
      upload,
      "ipfs://bafkreifivlt2emsugvh7pbeluwneqtkxebn73qytd7ulsipsgzrkk2liiy",
    );
  });

  it("should upload an MP4 file when passed in the animation_url property", async () => {
    const upload = await sdk.getStorage().uploadMetadata({
      animation_url: readFileSync("test/test.mp4"),
    });
    chai.assert.equal(
      upload,
      "ipfs://bafkreih6i5vu3ods5zz3c7j3f6ad5nt7fkoamsmbxpypl54zwdm4vsu4ju",
    );
  });

  it("should upload many objects correctly", async () => {
    const sampleObjects: { id: number; description: string }[] = [
      {
        id: 0,
        description: "test 0",
      },
      {
        id: 1,
        description: "test 1",
      },
    ];
    const serialized = sampleObjects.map((o) => JSON.stringify(o));
    const cid = await sdk.getStorage().uploadBatch(serialized);
    for (const object of sampleObjects) {
      const fetched = await sdk.getStorage().get(`ipfs://${cid}/${object.id}`);
      const parsed = JSON.parse(fetched);
      chai.assert.equal(parsed.description, object.description);
      chai.assert.equal(parsed.id, object.id);
    }
  });

  it("should upload many Buffers correctly", async () => {
    const sampleObjects: Buffer[] = [
      readFileSync("test/test.mp4"),
      readFileSync("test/test.mp4"),
      readFileSync("test/test.mp4"),
    ];
    const cid = await sdk.getStorage().uploadBatch(sampleObjects);
    console.log(cid);
  });
});
