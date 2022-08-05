import { ContractWrapper } from "./contract-wrapper";
import { BigNumber, CallOverrides, ContractTransaction } from "ethers";
import { ContractEncoder } from "./contract-encoder";
import { GasCostEstimator } from "./gas-cost-estimator";
import { TransactionResult } from "../types";

export class TransactionTask {
  static make(contractWrapper: ContractWrapper<any>, functionName: string) {
    return new TransactionTask(contractWrapper, functionName);
  }

  private contractWrapper: ContractWrapper<any>;
  private functionName: string;
  private args: any[] = [];
  private overrides: CallOverrides | undefined;
  private encoder: ContractEncoder<any>;
  private estimator: GasCostEstimator<any>;
  private hasComputedArgs = false;

  private preProcessor: (() => Promise<any[]>) | undefined;

  private constructor(
    contractWrapper: ContractWrapper<any>,
    functionName: string,
  ) {
    this.contractWrapper = contractWrapper;
    this.functionName = functionName;
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
  }

  public withArgs(...args: any[]): TransactionTask {
    this.args = args;
    return this;
  }

  public withArgsAsync(fn: () => Promise<any[]>): TransactionTask {
    this.preProcessor = fn;
    return this;
  }

  public withOverrides(overrides: CallOverrides): TransactionTask {
    this.overrides = overrides;
    return this;
  }

  public async encode(): Promise<string> {
    return this.encoder.encode(this.functionName, await this.computeArgs());
  }

  public async estimateGasLimit(): Promise<BigNumber> {
    return await this.estimator.gasLimitOf(
      this.functionName,
      await this.computeArgs(),
    );
  }

  public async estimateGasCostInEther(): Promise<string> {
    return await this.estimator.gasCostOf(
      this.functionName,
      await this.computeArgs(),
    );
  }

  public async submit(): Promise<ContractTransaction> {
    return await this.contractWrapper.sendTransactionByFunction(
      this.functionName,
      await this.computeArgs(),
      this.overrides || {},
    );
  }

  public async execute(): Promise<TransactionResult> {
    const receipt = await this.contractWrapper.sendTransaction(
      this.functionName,
      this.args,
      this.overrides || {},
    );
    return {
      receipt,
    };
  }

  private async computeArgs(): Promise<any[]> {
    const args =
      this.preProcessor && !this.hasComputedArgs
        ? await this.preProcessor()
        : this.args;
    this.hasComputedArgs = true;
    return args;
  }
}
