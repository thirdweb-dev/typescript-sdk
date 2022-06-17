import { BaseContract, Event } from "ethers";
import { ContractWrapper } from "./contract-wrapper";

export class ContractAnalytics<TContract extends BaseContract> {
  private contractWrapper: ContractWrapper<TContract>;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  public async query(
    eventName: keyof TContract["filters"] | string,
  ): Promise<Event[]> {
    const event = this.contractWrapper.readContract.interface.getEvent(
      eventName as string,
    );
    const filter = this.contractWrapper.readContract.filters[event.name];

    // TODO limit the number of blocks queried
    const fromBlock = 0;
    const toBlock =
      await this.contractWrapper.readContract.provider.getBlockNumber();
    return await this.contractWrapper.readContract.queryFilter(
      filter(),
      fromBlock,
      toBlock,
    );
  }
}
