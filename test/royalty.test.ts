import { ThirdwebSDK } from "../src/index";
import { RoyaltyModule } from "../src/modules/royalty";

global.fetch = require("node-fetch");

const RPC_URL = "https://matic-mumbai.chainstacklabs.com";

describe("Collection Module", async () => {
  let sdk: ThirdwebSDK;
  let royaltyModule: RoyaltyModule;

  beforeEach(async () => {
    sdk = new ThirdwebSDK(RPC_URL);

    royaltyModule = sdk.getRoyaltyModule("");
  });

  it("should return information on the royalties", async () => {
    return Promise.resolve();
  });
});
