import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { readFileSync } from "fs";
import { ipfsGatewayUrl, sdk, signers } from "./before.test";

import { expect, assert } from "chai";
import { IpfsStorage } from "../src/storage/IpfsStorage";
import { BufferOrStringWithName } from "../src/types/BufferOrStringWithName";
import FileOrBuffer from "../src/types/FileOrBuffer";
import { DuplicateFileNameError } from "../src";

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
      `${ipfsGatewayUrl}${upload.replace("ipfs://", "")}`,
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
      const uploadTest = (await getFile(data.test.test.image)).headers
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
      "ipfs://QmYKJLPfwKduSfWgdLLt49SE6LvzkGzxeYMCkhXWbpJam7/0",
    );
  });

  it("should upload an MP4 file when passed in the animation_url property", async () => {
    const upload = await sdk.getStorage().uploadMetadata({
      animation_url: readFileSync("test/test.mp4"),
    });
    assert.equal(
      upload,
      "ipfs://QmbaNzUcv7KPgdwq9u2qegcptktpUK6CdRZF72eSjSa6iJ/0",
    );
  });

  it("should upload many objects correctly", async () => {
    const sampleObjects: { id: number; description: string; prop: string }[] = [
      {
        id: 0,
        description: "test 0",
        prop: "123",
      },
      {
        id: 1,
        description: "test 1",
        prop: "321",
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
    ];
    const cid = await sdk.getStorage().uploadBatch(sampleObjects);
    console.log(cid);
  });

  it("should upload files with filenames correctly", async () => {
    const storage = sdk.getStorage();
    const sampleObjects: BufferOrStringWithName[] = [
      {
        data: readFileSync("test/test.mp4"),
        name: "test2.mp4",
      },
      { data: readFileSync("test/test.mp4"), name: "test3.mp4" },
      {
        data: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
        name: "test.jpeg",
      },
    ];
    const cid = await storage.uploadBatch(sampleObjects);
    console.log("filenames", cid);
    assert(
      (await getFile(`${cid}${"test.jpeg"}`)).headers
        .get("content-type")
        .toString() === "image/jpeg",
      `${cid}`,
    );
  });

  it("should upload files according to passed start file number", async () => {
    const storage = sdk.getStorage();
    const sampleObjects: FileOrBuffer[] = [
      readFileSync("test/test.mp4"),
      readFileSync("test/3510820011_4f558b6dea_b.jpg"),
    ];
    const cid = await storage.uploadBatch(sampleObjects, "", 1);
    assert(
      (await getFile(`${cid}2`)).headers.get("content-type").toString() ===
        "image/jpeg",
      `${cid}`,
    );
  });
  it("should upload files according to start file number as 0", async () => {
    const storage = sdk.getStorage();
    const sampleObjects = [
      readFileSync("test/3510820011_4f558b6dea_b.jpg"),
      readFileSync("test/test.mp4"),
    ];
    const cid = await storage.uploadBatch(sampleObjects, "");
    assert(
      (await getFile(`${cid}0`)).headers.get("content-type").toString() ===
        "image/jpeg",
      `${cid}`,
    );
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
    const storage = sdk.getStorage() as IpfsStorage;
    const { baseUri, metadataUris } = await storage.uploadMetadataBatch(
      sampleObjects,
    );
    assert(baseUri.length > 0);
    assert(metadataUris.length > 0);
  });

  it("should properly parse ipfs urls in uploadMetadataBatch", async () => {
    const sampleObjects: any[] = [
      "ipfs://QmTaWb3L89Deg8fxW8snWPULX6iNh5t7vfXa68sVeAfrHJ",
      { test: "should pass" },
      "https://ipfs.io",
      { test: "maybe pass" },
    ];
    const storage = sdk.getStorage() as IpfsStorage;
    const { baseUri, metadataUris } = await storage.uploadMetadataBatch(
      sampleObjects,
    );
    console.log(baseUri, metadataUris);
    assert(metadataUris.length === sampleObjects.length);
    assert(metadataUris[0] === sampleObjects[0]);
    assert(
      metadataUris[1].startsWith(baseUri) && metadataUris[1].endsWith("/0"),
    );
    assert(metadataUris[2] === sampleObjects[2]);
    assert(
      metadataUris[3].startsWith(baseUri) && metadataUris[3].endsWith("/1"),
    );
    assert(
      (await (await getFile(`${baseUri}0`)).text()).includes("should pass"),
    );
    assert(
      (await (await getFile(`${baseUri}1`)).text()).includes("maybe pass"),
    );
  });

  it("should upload properly with same file names but one with capitalized letters", async () => {
    const storage = sdk.getStorage();
    const sampleObjects: BufferOrStringWithName[] = [
      {
        data: readFileSync("test/test.mp4"),
        name: "test",
      },
      {
        data: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
        name: "TEST",
      },
    ];
    const cid = await storage.uploadBatch(sampleObjects);
    assert(
      (await getFile(`${cid}${"TEST"}`)).headers
        .get("content-type")
        .toString() === "image/jpeg",
      `${cid}`,
    );
  });

  it("should throw an error when trying to upload two files with the same name", async () => {
    const storage = sdk.getStorage();
    const sampleObjects: BufferOrStringWithName[] = [
      {
        data: readFileSync("test/test.mp4"),
        name: "test",
      },
      {
        data: readFileSync("test/3510820011_4f558b6dea_b.jpg"),
        name: "test",
      },
    ];
    try {
      await storage.uploadBatch(sampleObjects);
      assert.fail("should throw an error");
    } catch (e) {
      if (!(e instanceof DuplicateFileNameError)) {
        throw e;
      }
    }
  });
});
