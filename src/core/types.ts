import { Signer } from "@ethersproject/abstract-signer";
import { BaseContract, CallOverrides } from "@ethersproject/contracts";
import { Networkish, Provider } from "@ethersproject/providers";
import type { ContractWrapper } from "./classes/contract-wrapper";
import { IThirdwebModule } from "@3rdweb/contracts";
import { BigNumber, BytesLike } from "ethers";
import type { MODULES_MAP } from "./sdk";
import { C } from "ts-toolbelt";

export type ModuleType = keyof typeof MODULES_MAP;

export type ValidModuleClass = C.Instance<ValueOf<typeof MODULES_MAP>>;

export type ModuleForModuleType<TModuleType extends ModuleType> = C.Instance<
  typeof MODULES_MAP[TModuleType]
>;

export type NetworkOrSignerOrProvider = Networkish | Signer | Provider;

export type ThirdwebModuleOrBaseContract = IThirdwebModule | BaseContract;

export type ValueOf<T> = T[keyof T];

export type SignerOrProvider = Signer | Provider;

export type FileOrBuffer = File | Buffer;

export type BufferOrStringWithName = {
  data: Buffer | string;
  name?: string;
};

export interface IModule<TContract extends ThirdwebModuleOrBaseContract> {
  contract: ContractWrapper<TContract>;
  updateSignerOrProvider(network: NetworkOrSignerOrProvider): void;
}

/**
 * Forward Request Message that's used for gasless transaction
 * @public
 */
export type ForwardRequestMessage = {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  data: BytesLike;
};

/**
 * EIP-2612 token permit message for gasless transaction
 * @public
 */
export type PermitRequestMessage = {
  to: string;
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
};

/**
 * transaction message contains information that's needed to execute a gasless transaction
 */
export interface GaslessTransaction {
  from: string;
  to: string;
  data: string;
  chainId: number;
  gasLimit: BigNumber;
  functionName: string;
  functionArgs: any[];
  callOverrides: CallOverrides;
}
