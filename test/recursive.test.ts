import { recursiveResolve } from "../src/common/ipfs";
import { expect, assert } from "chai";

const ipfsGatewayUrl = "https://ipfs.infura.io/ipfs/";

describe("Recursive Testing", async () => {
  let json;
  beforeEach(async () => {
    json = {
      test: "test",
      test2: "ipfs://QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
      test3: {
        test: "test",
        test2: "ipfs://QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
        test3: {
          test: "test",
          test2: "ipfs://QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
        },
      },
    };
  });
  it("should resolve all URLs when resolveGateway is set to true", async () => {
    const resolveGateway = true;
    if (resolveGateway) {
      json = await recursiveResolve(json, ipfsGatewayUrl);
    }
    assert.notStrictEqual(json, {
      test2:
        "https://ipfs.infura.io/ipfs/QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
      test3: {
        test: "test",
        test2:
          "https://ipfs.infura.io/ipfs/QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
        test3: {
          test: "test",
          test2:
            "https://ipfs.infura.io/ipfs/QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
        },
      },
    });
  });
  it("should resolve all URLs when resolveGateway is set to true", async () => {
    const resolveGateway = false;
    if (resolveGateway) {
      json = await recursiveResolve(json, ipfsGatewayUrl);
    }
    assert.notStrictEqual(json, {
      test: "test",
      test2: "ipfs://QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
      test3: {
        test: "test",
        test2: "ipfs://QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
        test3: {
          test: "test",
          test2: "ipfs://QmWq3Z9w6Z6Y5YQ7NxZb1x3uQ5ZqxqQjzXWqZKXZ7YXoZu",
        },
      },
    });
  });
});
