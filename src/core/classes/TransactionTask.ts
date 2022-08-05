import { ContractWrapper } from "./contract-wrapper";
import { BigNumber, CallOverrides, ContractTransaction } from "ethers";
import { ContractEncoder } from "./contract-encoder";
import { GasCostEstimator } from "./gas-cost-estimator";
import { TransactionResult } from "../types";

class TransactionTaskBuilder {
  public contractWrapper: ContractWrapper<any>;
  public functionName: string;
  public args: any[] = [];
  public overrides: CallOverrides | undefined;

  constructor(contractWrapper: ContractWrapper<any>, functionName: string) {
    this.contractWrapper = contractWrapper;
    this.functionName = functionName;
  }

  public withArgs(...args: any[]): TransactionTaskBuilder {
    this.args = args;
    return this;
  }

  public withOverrides(overrides: CallOverrides): TransactionTaskBuilder {
    this.overrides = overrides;
    return this;
  }

  public build(): TransactionTask {
    return new TransactionTask(this);
  }

  // TODO gasless
}

export class TransactionTask {
  static builder(contractWrapper: ContractWrapper<any>, functionName: string) {
    return new TransactionTaskBuilder(contractWrapper, functionName);
  }

  private contractWrapper: ContractWrapper<any>;
  private functionName: string;
  private args: any[] = [];
  private overrides: CallOverrides | undefined;
  private encoder: ContractEncoder<any>;
  private estimator: GasCostEstimator<any>;

  constructor(builder: TransactionTaskBuilder) {
    this.contractWrapper = builder.contractWrapper;
    this.functionName = builder.functionName;
    this.args = builder.args;
    this.overrides = builder.overrides;
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
  }

  // ////////////// Overrides ////////////////

  public overrideGasLimit(gasLimit: BigNumber): TransactionTask {
    this.overrides = {
      ...this.overrides,
      gasLimit,
    };
    return this;
  }

  public overrideGasPrice(gasPrice: BigNumber): TransactionTask {
    this.overrides = {
      ...this.overrides,
      gasPrice,
    };
    return this;
  }

  public overrideNonce(nonce: BigNumber): TransactionTask {
    this.overrides = {
      ...this.overrides,
      nonce,
    };
    return this;
  }

  public overrideValue(value: BigNumber): TransactionTask {
    this.overrides = {
      ...this.overrides,
      value,
    };
    return this;
  }

  // ////////////// Estimates ////////////////

  public async estimateGasLimit(): Promise<BigNumber> {
    return await this.estimator.gasLimitOf(this.functionName, this.args);
  }

  public async estimateGasCostInEther(): Promise<string> {
    return await this.estimator.gasCostOf(this.functionName, this.args);
  }

  // ////////////// Actions ////////////////

  public async encode(): Promise<string> {
    return this.encoder.encode(this.functionName, this.args);
  }

  public async submit(): Promise<ContractTransaction> {
    return await this.contractWrapper.sendTransactionByFunction(
      this.functionName,
      this.args,
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
}
