import { ThirdwebSDK } from "../src/index";
import { SplitsModule } from "../src/modules/royalty";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Collection Module", async () => {
  let sdk: ThirdwebSDK;
  let royaltyModule: SplitsModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(RPC_URL);

    royaltyModule = sdk.getSplitsModule("");
  });

  it("should return information on the royalties", async () => {
    return Promise.resolve();
  });
});
