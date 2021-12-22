import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { readFileSync } from "fs";
import { sdk, signers } from "./before.test";

import { expect, assert } from "chai";
import { IpfsStorage } from "../src/storage/IpfsStorage";

global.fetch = require("node-fetch");

describe("IPFS Uploads", async () => {
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);
  });

  async function getFile(upload: string): Promise<Response> {
    const response = await fetch(
      `https://nftlabs.mypinata.cloud/ipfs/${upload.replace("ipfs://", "")}`,
    )
      .then(async (res) => {
        return res;
      })
      .catch((e) => {
        assert.fail(e);
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

      assert.equal(uploadTest, "image/jpeg");
    } catch (err) {
      assert.fail(err);
    }
  });

  it("should not upload the string to IPFS", async () => {
    const upload = await sdk.getStorage().uploadMetadata({
      image:
        "ipfs://QmZsU8nTTexTxPzCKZKqo3Ntf5cUiWMRahoLmtpimeaCiT/face_parts/Asset%20331.svg",
    });
    assert.equal(
      upload,
      "ipfs://bafkreifivlt2emsugvh7pbeluwneqtkxebn73qytd7ulsipsgzrkk2liiy",
    );
  });

  it("should upload an MP4 file when passed in the animation_url property", async () => {
    const upload = await sdk.getStorage().uploadMetadata({
      animation_url: readFileSync("test/test.mp4"),
    });
    assert.equal(
      upload,
      "ipfs://bafkreih6i5vu3ods5zz3c7j3f6ad5nt7fkoamsmbxpypl54zwdm4vsu4ju",
    );
  });

  it("should upload many objects correctly", async () => {
    const sampleObjects: { id: number; description: string; prop: string }[] = [
      {
        id: 0,
        description: "test 0",
        prop: Math.random().toString(),
      },
      {
        id: 1,
        description: "test 1",
        prop: Math.random().toString(),
      },
    ];
    const serialized = sampleObjects.map((o) => Buffer.from(JSON.stringify(o)));
    const cid = await sdk.getStorage().uploadBatch(serialized);
    for (const object of sampleObjects) {
      const fetched = await sdk.getStorage().get(`${cid}${object.id}`);
      const parsed = JSON.parse(fetched);
      assert.equal(parsed.description, object.description);
      assert.equal(parsed.id, object.id);
    }
  });

  it("should upload many Buffers correctly", async () => {
    const sampleObjects: Buffer[] = [
      readFileSync("test/test.mp4"),
      readFileSync("test/test.mp4"),
      readFileSync("test/test.mp4"),
    ];
    const cid = await sdk.getStorage().uploadBatch(sampleObjects);
  });

  it("should upload properties recursively in batch", async () => {
    const sampleObjects: any[] = [
      {
        name: "test 0",
        image: readFileSync("test/test.mp4"),
      },
      {
        name: "test 1",
        properties: {
          image: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
        },
      },
      {
        name: "test 1",
        image: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
        properties: {
          test: {
            image: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
          },
        },
      },
    ];
    const storage = (await sdk.getStorage()) as IpfsStorage;
    console.log(await storage.uploadMetadataBatch(sampleObjects));
  });
});
