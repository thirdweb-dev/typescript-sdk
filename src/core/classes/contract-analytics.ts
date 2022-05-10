import { BaseContract, ethers, Event } from "ethers";
import { ChainId } from "../../constants";
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

    const fromBlock = 0;
    const toBlock =
      await this.contractWrapper.readContract.provider.getBlockNumber();

    const network =
      await this.contractWrapper.readContract.provider.getNetwork();
    const alchemyContractWrapper = new ContractWrapper(
      network.chainId === ChainId.Localhost ||
      network.chainId === ChainId.Hardhat
        ? this.contractWrapper.readContract.provider
        : new ethers.providers.AlchemyProvider(network.name),
      this.contractWrapper.readContract.address,
      this.contractWrapper.abi,
      {},
    );

    let events: Event[] = [];
    events = await alchemyContractWrapper.readContract.queryFilter(
      filter(),
      fromBlock,
      toBlock,
    );

    return events;
  }
}
