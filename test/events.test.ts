import { ethers } from "ethers";
import { DropModule } from "../src";
import { EventType } from "../src/core/events";
import { appModule, sdk } from "./before.test";

describe("Events", async () => {
  let dropModule: DropModule;

  beforeEach(async () => {
    dropModule = await appModule.deployDropModule({
      name: "Test Drop",
      maxSupply: 1000,
      primarySaleRecipientAddress: ethers.constants.AddressZero,
    });
  });

  it.skip("should emit Transaction events", async () => {
    let txStatus = "";
    sdk.event.on(EventType.Transaction, (event) => {
      console.log(event);
      // TODO: need to use chai-events
      if (!txStatus) {
        expect(event.status).toBe("submitted");
        expect(event.transactionHash).toBeTruthy();
      } else if (txStatus === "submitted") {
        expect(event.status).toBe("completed");
        expect(event.transactionHash).toBeTruthy();
      }
      txStatus = event.status;
    });
    await dropModule.setApproval(ethers.constants.AddressZero, true);
  });
});
