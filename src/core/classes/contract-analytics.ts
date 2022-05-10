import { BaseContract, Event } from "ethers";
import { ContractWrapper } from "./contract-wrapper";

export class ContractAnalytics<TContract extends BaseContract> {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  public async query(
    eventName: keyof TContract["filters"] | string,
  ): Promise<Event[]> {
    const event = this.contractWrapper.readContract.interface.getEvent(
      eventName as string,
    );

    let fromBlock = 0;
    let toBlock = 1000;
    const lastBlock = await this.contractWrapper.getProvider().getBlockNumber();
    let logs: Event[] = [];

    while (fromBlock < lastBlock) {
      const events = await this.contractWrapper.readContract.queryFilter(
        this.contractWrapper.readContract.filters[event.name](),
        fromBlock,
        toBlock > lastBlock ? lastBlock : toBlock,
      );

      logs = [...logs, ...events];

      fromBlock += 1000;
      toBlock += 1000;
    }

    return logs;
  }
}
