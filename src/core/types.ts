import { Signer } from "@ethersproject/abstract-signer";
import { CallOverrides } from "@ethersproject/contracts";
import { Networkish, Provider } from "@ethersproject/providers";
import { BigNumber, BytesLike } from "ethers";
import { C } from "ts-toolbelt";
import type { MODULES_MAP } from "../modules";

export type ModuleType = keyof typeof MODULES_MAP;

export type ValidModuleClass = ValueOf<typeof MODULES_MAP>;

export type ValidModuleInstance = C.Instance<ValidModuleClass>;

export type ModuleForModuleType<TModuleType extends ModuleType> = C.Instance<
  typeof MODULES_MAP[TModuleType]
>;

export type NetworkOrSignerOrProvider = Networkish | Signer | Provider;
export type ValueOf<T> = T[keyof T];

export type SignerOrProvider = Signer | Provider;

export type FileOrBuffer = File | Buffer;

export type BufferOrStringWithName = {
  data: Buffer | string;
  name?: string;
};

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
