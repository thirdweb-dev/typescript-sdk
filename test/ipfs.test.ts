import { readFileSync } from "fs";
import { ipfsGatewayUrl } from "./before.test";

import { assert, expect } from "chai";
import { BufferOrStringWithName } from "../src/types/BufferOrStringWithName";
import {
  DuplicateFileNameError,
  FileOrBuffer,
  IpfsStorage,
  NFTMetadataInput,
} from "../src";

global.fetch = require("node-fetch");

describe("IPFS Uploads", async () => {
  const storage: IpfsStorage = new IpfsStorage(ipfsGatewayUrl);

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
      const upload = await storage.uploadMetadata({
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
        ?.get("content-type")
        ?.toString();

      assert.equal(uploadTest, "image/jpeg");
    } catch (err) {
      assert.fail(err as string);
    }
  });

  it("should not upload the string to IPFS", async () => {
    const upload = await storage.uploadMetadata({
      image:
        "ipfs://QmZsU8nTTexTxPzCKZKqo3Ntf5cUiWMRahoLmtpimeaCiT/face_parts/Asset%20331.svg",
    });
    assert.equal(
      upload,
      "ipfs://QmYKJLPfwKduSfWgdLLt49SE6LvzkGzxeYMCkhXWbpJam7/0",
    );
  });

  it("should upload an MP4 file when passed in the animation_url property", async () => {
    const upload = await storage.uploadMetadata({
      animation_url: readFileSync("test/test.mp4"),
    });
    assert.equal(
      upload,
      "ipfs://QmbaNzUcv7KPgdwq9u2qegcptktpUK6CdRZF72eSjSa6iJ/0",
    );
  });

  it("should upload an media file and resolve to gateway URL when fetching it", async () => {
    const upload = await storage.uploadMetadata({
      animation_url: readFileSync("test/test.mp4"),
    });
    assert.equal(
      upload,
      "ipfs://QmbaNzUcv7KPgdwq9u2qegcptktpUK6CdRZF72eSjSa6iJ/0",
    );
    const meta = await storage.get(upload);
    assert.equal(
      meta.animation_url,
      `${ipfsGatewayUrl}QmUphf8LnNGdFwBevnxNkq8dxcZ4qxzzPjoNMDkSQfECKM/0`,
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
    const cid = await storage.uploadBatch(serialized);
    for (const object of sampleObjects) {
      const parsed = await storage.get(`${cid}${object.id}`);
      assert.equal(parsed.description, object.description);
      assert.equal(parsed.id, object.id);
    }
  });

  it("should upload many Buffers correctly", async () => {
    const sampleObjects: Buffer[] = [
      readFileSync("test/test.mp4"),
      readFileSync("test/test.mp4"),
    ];
    const cid = await storage.uploadBatch(sampleObjects);
    console.log(cid);
  });

  it("should upload files with filenames correctly", async () => {
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
    const response = await getFile(`${cid}test.jpeg`);
    assert(
      response.headers?.get("content-type")?.toString() === "image/jpeg",
      `${cid}`,
    );
  });

  it("should upload files according to passed start file number", async () => {
    const sampleObjects: FileOrBuffer[] = [
      readFileSync("test/test.mp4"),
      readFileSync("test/3510820011_4f558b6dea_b.jpg"),
    ];
    const cid = await storage.uploadBatch(sampleObjects, 1);
    assert(
      (await getFile(`${cid}2`)).headers?.get("content-type")?.toString() ===
        "image/jpeg",
      `${cid}`,
    );
  });
  it("should upload files according to start file number as 0", async () => {
    const sampleObjects = [
      readFileSync("test/3510820011_4f558b6dea_b.jpg"),
      readFileSync("test/test.mp4"),
    ];
    const cid = await storage.uploadBatch(sampleObjects);

    console.log("cid", cid);
    assert(
      (await getFile(`${cid}0`)).headers?.get("content-type")?.toString() ===
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
        image: readFileSync("test/images/1.jpg"),
        properties: {
          image: readFileSync("test/images/2.jpg"),
        },
      },
      {
        name: "test 2",
        image: readFileSync("test/images/3.jpg"),
        properties: {
          image: readFileSync("test/images/4.jpg"),
          test: {
            image: readFileSync("test/images/5.jpg"),
          },
        },
      },
    ];
    const { baseUri, metadataUris } = await storage.uploadMetadataBatch(
      sampleObjects,
    );
    assert(baseUri.startsWith("ipfs://") && baseUri.endsWith("/"));
    assert(metadataUris.length === sampleObjects.length);
    const [metadata1, metadata2, metadata3] = await Promise.all(
      (
        await Promise.all(metadataUris.map((m) => getFile(m)))
      ).map((m: any) => m.json()),
    );
    assert(
      metadata1.image ===
        "ipfs://QmTpv5cWy677mgABsgJgwZ6pe2bEpSWQTvcCb8Hmj3ac8E/0",
    );
    assert(
      metadata2.image ===
        "ipfs://QmTpv5cWy677mgABsgJgwZ6pe2bEpSWQTvcCb8Hmj3ac8E/1",
    );
    assert(
      metadata3.image ===
        "ipfs://QmTpv5cWy677mgABsgJgwZ6pe2bEpSWQTvcCb8Hmj3ac8E/3",
    );
  });

  it("should upload properties in right order", async () => {
    const sampleObjects: NFTMetadataInput[] = [];
    for (let i = 0; i < 30; i++) {
      const nft: NFTMetadataInput = {
        name: `${i}`,
        image: readFileSync(`test/images/${i % 5}.jpg`),
      };
      sampleObjects.push(nft);
    }
    const { baseUri, metadataUris } = await storage.uploadMetadataBatch(
      sampleObjects,
    );
    assert(baseUri.startsWith("ipfs://") && baseUri.endsWith("/"));
    assert(metadataUris.length === sampleObjects.length);
    const metadatas = await Promise.all(
      metadataUris.map(async (m) => await storage.get(m)),
    );
    for (let i = 0; i < metadatas.length; i++) {
      const expected = sampleObjects[i];
      const downloaded = metadatas[i];
      console.log(downloaded);
      expect(downloaded.name).to.be.eq(expected.name);
      expect(downloaded.image.endsWith(`${i}`)).to.eq(true);
    }
  });

  // TODO make passing straight urls passthrough storage or handled at higher level
  it.skip("should properly parse ipfs urls in uploadMetadataBatch", async () => {
    // TODO this mismatches urls/objects - can probably restrict to either or
    const sampleObjects: any[] = [
      "ipfs://QmTaWb3L89Deg8fxW8snWPULX6iNh5t7vfXa68sVeAfrHJ",
      { test: "should pass" },
      "https://ipfs.io",
      { test: "maybe pass" },
    ];
    const { baseUri, metadataUris } = await storage.uploadMetadataBatch(
      sampleObjects,
    );
    console.log(baseUri, metadataUris);
    assert(metadataUris.length === sampleObjects.length);
    assert(
      metadataUris[0] === sampleObjects[0],
      `Got ${metadataUris[0]}, expected ${sampleObjects[0]}`,
    );
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
      (await getFile(`${cid}TEST`)).headers?.get("content-type")?.toString() ===
        "image/jpeg",
      `${cid}`,
    );
  });

  it("should throw an error when trying to upload two files with the same name", async () => {
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

  it("bulk upload", async () => {
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
