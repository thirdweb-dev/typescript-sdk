/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface ProtocolControlInterface extends ethers.utils.Interface {
  functions: {
    "DEFAULT_ADMIN_ROLE()": FunctionFragment;
    "MAX_BPS()": FunctionFragment;
    "NFTLABS()": FunctionFragment;
    "PROTOCOL_ADMIN()": FunctionFragment;
    "_contractURI()": FunctionFragment;
    "addModule(address,uint8)": FunctionFragment;
    "contractURI()": FunctionFragment;
    "getAllModulesOfType(uint256)": FunctionFragment;
    "getRoleAdmin(bytes32)": FunctionFragment;
    "grantRole(bytes32,address)": FunctionFragment;
    "hasRole(bytes32,address)": FunctionFragment;
    "marketFeeBps()": FunctionFragment;
    "moduleType(bytes32)": FunctionFragment;
    "modules(bytes32)": FunctionFragment;
    "nftlabsTreasury()": FunctionFragment;
    "numOfModuleType(uint256)": FunctionFragment;
    "pauseProtocol(bool)": FunctionFragment;
    "renounceRole(bytes32,address)": FunctionFragment;
    "revokeRole(bytes32,address)": FunctionFragment;
    "setContractURI(string)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "systemPaused()": FunctionFragment;
    "transferProtocolFunds(address,address,uint256)": FunctionFragment;
    "updateMarketFeeBps(uint128)": FunctionFragment;
    "updateModule(bytes32,address)": FunctionFragment;
    "updateNftlabsTreasury(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "MAX_BPS", values?: undefined): string;
  encodeFunctionData(functionFragment: "NFTLABS", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "PROTOCOL_ADMIN",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "_contractURI",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "addModule",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "contractURI",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getAllModulesOfType",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "marketFeeBps",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "moduleType",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "modules", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "nftlabsTreasury",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "numOfModuleType",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "pauseProtocol",
    values: [boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setContractURI",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "systemPaused",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferProtocolFunds",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "updateMarketFeeBps",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "updateModule",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "updateNftlabsTreasury",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "MAX_BPS", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "NFTLABS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "PROTOCOL_ADMIN",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "_contractURI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "addModule", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "contractURI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAllModulesOfType",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "marketFeeBps",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "moduleType", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "modules", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "nftlabsTreasury",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "numOfModuleType",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pauseProtocol",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setContractURI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "systemPaused",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferProtocolFunds",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateMarketFeeBps",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateModule",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateNftlabsTreasury",
    data: BytesLike
  ): Result;

  events: {
    "FundsTransferred(address,address,uint256)": EventFragment;
    "MarketFeeBps(uint256)": EventFragment;
    "ModuleUpdated(bytes32,address,uint256)": EventFragment;
    "NFTLabsTreasury(address)": EventFragment;
    "RoleAdminChanged(bytes32,bytes32,bytes32)": EventFragment;
    "RoleGranted(bytes32,address,address)": EventFragment;
    "RoleRevoked(bytes32,address,address)": EventFragment;
    "SystemPaused(bool)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FundsTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MarketFeeBps"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ModuleUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NFTLabsTreasury"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SystemPaused"): EventFragment;
}

export type FundsTransferredEvent = TypedEvent<
  [string, string, BigNumber] & { asset: string; to: string; amount: BigNumber }
>;

export type MarketFeeBpsEvent = TypedEvent<
  [BigNumber] & { marketFeeBps: BigNumber }
>;

export type ModuleUpdatedEvent = TypedEvent<
  [string, string, BigNumber] & {
    moduleId: string;
    module: string;
    moduleType: BigNumber;
  }
>;

export type NFTLabsTreasuryEvent = TypedEvent<
  [string] & { _nftlabsTreasury: string }
>;

export type RoleAdminChangedEvent = TypedEvent<
  [string, string, string] & {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  }
>;

export type RoleGrantedEvent = TypedEvent<
  [string, string, string] & { role: string; account: string; sender: string }
>;

export type RoleRevokedEvent = TypedEvent<
  [string, string, string] & { role: string; account: string; sender: string }
>;

export type SystemPausedEvent = TypedEvent<[boolean] & { isPaused: boolean }>;

export class ProtocolControl extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: ProtocolControlInterface;

  functions: {
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<[string]>;

    MAX_BPS(overrides?: CallOverrides): Promise<[BigNumber]>;

    NFTLABS(overrides?: CallOverrides): Promise<[string]>;

    PROTOCOL_ADMIN(overrides?: CallOverrides): Promise<[string]>;

    _contractURI(overrides?: CallOverrides): Promise<[string]>;

    addModule(
      _newModuleAddress: string,
      _moduleType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    contractURI(overrides?: CallOverrides): Promise<[string]>;

    getAllModulesOfType(
      _moduleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string[]] & { allModules: string[] }>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    marketFeeBps(overrides?: CallOverrides): Promise<[BigNumber]>;

    moduleType(arg0: BytesLike, overrides?: CallOverrides): Promise<[number]>;

    modules(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    nftlabsTreasury(overrides?: CallOverrides): Promise<[string]>;

    numOfModuleType(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    pauseProtocol(
      _toPause: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setContractURI(
      _URI: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    systemPaused(overrides?: CallOverrides): Promise<[boolean]>;

    transferProtocolFunds(
      _asset: string,
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    updateMarketFeeBps(
      _newFeeBps: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    updateModule(
      _moduleId: BytesLike,
      _newModuleAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    updateNftlabsTreasury(
      _newTreasury: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

  MAX_BPS(overrides?: CallOverrides): Promise<BigNumber>;

  NFTLABS(overrides?: CallOverrides): Promise<string>;

  PROTOCOL_ADMIN(overrides?: CallOverrides): Promise<string>;

  _contractURI(overrides?: CallOverrides): Promise<string>;

  addModule(
    _newModuleAddress: string,
    _moduleType: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  contractURI(overrides?: CallOverrides): Promise<string>;

  getAllModulesOfType(
    _moduleType: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

  grantRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  hasRole(
    role: BytesLike,
    account: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  marketFeeBps(overrides?: CallOverrides): Promise<BigNumber>;

  moduleType(arg0: BytesLike, overrides?: CallOverrides): Promise<number>;

  modules(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  nftlabsTreasury(overrides?: CallOverrides): Promise<string>;

  numOfModuleType(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  pauseProtocol(
    _toPause: boolean,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  revokeRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setContractURI(
    _URI: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  systemPaused(overrides?: CallOverrides): Promise<boolean>;

  transferProtocolFunds(
    _asset: string,
    _to: string,
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  updateMarketFeeBps(
    _newFeeBps: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  updateModule(
    _moduleId: BytesLike,
    _newModuleAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  updateNftlabsTreasury(
    _newTreasury: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

    MAX_BPS(overrides?: CallOverrides): Promise<BigNumber>;

    NFTLABS(overrides?: CallOverrides): Promise<string>;

    PROTOCOL_ADMIN(overrides?: CallOverrides): Promise<string>;

    _contractURI(overrides?: CallOverrides): Promise<string>;

    addModule(
      _newModuleAddress: string,
      _moduleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    contractURI(overrides?: CallOverrides): Promise<string>;

    getAllModulesOfType(
      _moduleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    marketFeeBps(overrides?: CallOverrides): Promise<BigNumber>;

    moduleType(arg0: BytesLike, overrides?: CallOverrides): Promise<number>;

    modules(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    nftlabsTreasury(overrides?: CallOverrides): Promise<string>;

    numOfModuleType(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    pauseProtocol(_toPause: boolean, overrides?: CallOverrides): Promise<void>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setContractURI(_URI: string, overrides?: CallOverrides): Promise<void>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    systemPaused(overrides?: CallOverrides): Promise<boolean>;

    transferProtocolFunds(
      _asset: string,
      _to: string,
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    updateMarketFeeBps(
      _newFeeBps: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    updateModule(
      _moduleId: BytesLike,
      _newModuleAddress: string,
      overrides?: CallOverrides
    ): Promise<void>;

    updateNftlabsTreasury(
      _newTreasury: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "FundsTransferred(address,address,uint256)"(
      asset?: null,
      to?: null,
      amount?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { asset: string; to: string; amount: BigNumber }
    >;

    FundsTransferred(
      asset?: null,
      to?: null,
      amount?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { asset: string; to: string; amount: BigNumber }
    >;

    "MarketFeeBps(uint256)"(
      marketFeeBps?: null
    ): TypedEventFilter<[BigNumber], { marketFeeBps: BigNumber }>;

    MarketFeeBps(
      marketFeeBps?: null
    ): TypedEventFilter<[BigNumber], { marketFeeBps: BigNumber }>;

    "ModuleUpdated(bytes32,address,uint256)"(
      moduleId?: BytesLike | null,
      module?: string | null,
      moduleType?: BigNumberish | null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { moduleId: string; module: string; moduleType: BigNumber }
    >;

    ModuleUpdated(
      moduleId?: BytesLike | null,
      module?: string | null,
      moduleType?: BigNumberish | null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { moduleId: string; module: string; moduleType: BigNumber }
    >;

    "NFTLabsTreasury(address)"(
      _nftlabsTreasury?: null
    ): TypedEventFilter<[string], { _nftlabsTreasury: string }>;

    NFTLabsTreasury(
      _nftlabsTreasury?: null
    ): TypedEventFilter<[string], { _nftlabsTreasury: string }>;

    "RoleAdminChanged(bytes32,bytes32,bytes32)"(
      role?: BytesLike | null,
      previousAdminRole?: BytesLike | null,
      newAdminRole?: BytesLike | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; previousAdminRole: string; newAdminRole: string }
    >;

    RoleAdminChanged(
      role?: BytesLike | null,
      previousAdminRole?: BytesLike | null,
      newAdminRole?: BytesLike | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; previousAdminRole: string; newAdminRole: string }
    >;

    "RoleGranted(bytes32,address,address)"(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; sender: string }
    >;

    RoleGranted(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; sender: string }
    >;

    "RoleRevoked(bytes32,address,address)"(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; sender: string }
    >;

    RoleRevoked(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; sender: string }
    >;

    "SystemPaused(bool)"(
      isPaused?: null
    ): TypedEventFilter<[boolean], { isPaused: boolean }>;

    SystemPaused(
      isPaused?: null
    ): TypedEventFilter<[boolean], { isPaused: boolean }>;
  };

  estimateGas: {
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    MAX_BPS(overrides?: CallOverrides): Promise<BigNumber>;

    NFTLABS(overrides?: CallOverrides): Promise<BigNumber>;

    PROTOCOL_ADMIN(overrides?: CallOverrides): Promise<BigNumber>;

    _contractURI(overrides?: CallOverrides): Promise<BigNumber>;

    addModule(
      _newModuleAddress: string,
      _moduleType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    contractURI(overrides?: CallOverrides): Promise<BigNumber>;

    getAllModulesOfType(
      _moduleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    marketFeeBps(overrides?: CallOverrides): Promise<BigNumber>;

    moduleType(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    modules(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    nftlabsTreasury(overrides?: CallOverrides): Promise<BigNumber>;

    numOfModuleType(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    pauseProtocol(
      _toPause: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setContractURI(
      _URI: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    systemPaused(overrides?: CallOverrides): Promise<BigNumber>;

    transferProtocolFunds(
      _asset: string,
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    updateMarketFeeBps(
      _newFeeBps: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    updateModule(
      _moduleId: BytesLike,
      _newModuleAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    updateNftlabsTreasury(
      _newTreasury: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DEFAULT_ADMIN_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    MAX_BPS(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    NFTLABS(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PROTOCOL_ADMIN(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    _contractURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addModule(
      _newModuleAddress: string,
      _moduleType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    contractURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getAllModulesOfType(
      _moduleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    marketFeeBps(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    moduleType(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    modules(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    nftlabsTreasury(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    numOfModuleType(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    pauseProtocol(
      _toPause: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setContractURI(
      _URI: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    systemPaused(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferProtocolFunds(
      _asset: string,
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    updateMarketFeeBps(
      _newFeeBps: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    updateModule(
      _moduleId: BytesLike,
      _newModuleAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    updateNftlabsTreasury(
      _newTreasury: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
