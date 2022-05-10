import { BaseContract, ethers, Event } from "ethers";
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
    const filter = this.contractWrapper.readContract.filters[event.name];

    const fromBlock = 0;
    const toBlock =
      await this.contractWrapper.readContract.provider.getBlockNumber();

    let events: Event[] = [];
    const oldProvider = this.contractWrapper.getProvider();
    try {
      const network =
        await this.contractWrapper.readContract.provider.getNetwork();
      if (network.chainId !== 1337 && network.chainId !== 31337) {
        const alchemyProvider = new ethers.providers.AlchemyProvider(
          network.name,
        );
        this.contractWrapper.updateSignerOrProvider(alchemyProvider);
      }

      events = await this.contractWrapper.readContract.queryFilter(
        filter(),
        fromBlock,
        toBlock,
      );
      this.contractWrapper.updateSignerOrProvider(oldProvider);
    } catch (err) {
      this.contractWrapper.updateSignerOrProvider(oldProvider);
    }

    return events;
  }
}
