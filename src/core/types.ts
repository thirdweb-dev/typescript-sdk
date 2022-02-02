import { Signer } from "@ethersproject/abstract-signer";
import { CallOverrides } from "@ethersproject/contracts";
import {
  Networkish,
  Provider,
  TransactionReceipt,
} from "@ethersproject/providers";
import { BigNumber, BytesLike } from "ethers";
import { A, C } from "ts-toolbelt";
import { If } from "ts-toolbelt/out/Any/If";
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

export type BufferOrStringWithName = {
  data: Buffer | string;
  name?: string;
};

type JsonLiteral = boolean | null | number | string;
type JsonLiteralOrFileOrBuffer = JsonLiteral | FileOrBuffer;
export type Json = JsonLiteralOrFileOrBuffer | JsonObject | Json[];
export type JsonObject = { [key: string]: Json };

export type FileOrBuffer = File | Buffer | BufferOrStringWithName;

type TransactionResultWithMetadata<T = unknown> = {
  receipt: TransactionReceipt;
  data: () => Promise<T>;
};

export type TransactionResultWithId<T = never> = TransactionResult<T> & {
  id: BigNumber;
};

export type TransactionResult<T = never> = If<
  A.Is<T, never, "equals">,
  Omit<TransactionResultWithMetadata, "data">,
  TransactionResultWithMetadata<T>
>;

export type TransactionResultPromise<T = never> = Promise<TransactionResult<T>>;

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
