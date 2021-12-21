import { recursiveResolveGatewayUrl } from "../src/common/ipfs";
import { assert } from "chai";

const ipfsGatewayUrl = "https://ipfs.thirdweb.com/ipfs/";

describe("Recursive Testing", async () => {
  let json;
  beforeEach(async () => {
    json = {
      test: "test",
      test2: "ipfs://QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
      test3: {
        test: "test",
        test2: "ipfs://QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
        test3: {
          test: "test",
          test2: "ipfs://QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
        },
      },
    };
  });
  it("should resolve all URLs when resolveGateway is set to true", async () => {
    const resolveGateway = true;
    if (resolveGateway) {
      json = await recursiveResolveGatewayUrl(json, ipfsGatewayUrl);
    }
    assert.notStrictEqual(json, {
      test2:
        "https://ipfs.thirdweb.com/ipfs/QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
      test3: {
        test: "test",
        test2:
          "https://ipfs.thirdweb.com/ipfs/QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
        test3: {
          test: "test",
          test2:
            "https://ipfs.thirdweb.com/ipfs/QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
        },
      },
    });
  });
  it("should resolve all URLs when resolveGateway is set to true", async () => {
    const resolveGateway = false;
    if (resolveGateway) {
      json = await recursiveResolveGatewayUrl(json, ipfsGatewayUrl);
    }
    assert.notStrictEqual(json, {
      test: "test",
      test2: "ipfs://QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
      test3: {
        test: "test",
        test2: "ipfs://QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
        test3: {
          test: "test",
          test2: "ipfs://QmTJyQwBhbELaceUScbM29G3HRpk4GdKXMuVxAxGCGtXME",
        },
      },
    });
  });
});
