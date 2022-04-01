import { NetworkOrSignerOrProvider } from "../types";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces";
import { RPCConnectionHandler } from "./rpc-connection-handler";
import { BytesLike, ContractInterface, ethers } from "ethers";
import invariant from "tiny-invariant";
import {
  extractConstructorParams,
  fetchContractMetadata,
} from "../../common/feature-detection";

/**
 * Handles publishing contracts (EXPERIMENTAL)
 * @internal
 */
export class ContractPublisher extends RPCConnectionHandler {
  // TODO private _registry: Promise<ContractRegistry> | undefined;
  private storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage,
  ) {
    super(network, options);
    this.storage = storage;
  }

  /**
   * @internal
   * @param metadataUri
   */
  public async extractConstructorParams(metadataUri: string) {
    return extractConstructorParams(metadataUri, this.storage);
  }

  /**
   * @internal
   * @param metadataUri
   */
  public async fetchFullContractMetadata(metadataUri: string) {
    return fetchContractMetadata(metadataUri, this.storage);
  }

  // TODO publish contract
  // TODO unpublish contract
  // TODO getAllPublishedContract

  /**
   * @internal
   * @param metadataUri
   * @param constructorParams
   */
  public async deployCustomContract(
    metadataUri: string,
    constructorParams: Array<any>,
  ): Promise<string> {
    const metadata = await this.fetchFullContractMetadata(metadataUri);
    // TODO deploy via registry, we won't be deploying directly through SDK
    return this.deployCustomContractWithAbi(
      metadata.abi,
      metadata.bytecode,
      constructorParams,
    );
  }

  /**
   * @internal
   * @param abi
   * @param bytecode
   * @param constructorParams
   */
  public async deployCustomContractWithAbi(
    abi: ContractInterface,
    bytecode: BytesLike | { object: string },
    constructorParams: Array<any>,
  ): Promise<string> {
    const signer = this.getSigner();
    invariant(signer, "Signer is required to deploy contracts");
    const deployer = await new ethers.ContractFactory(abi, bytecode)
      .connect(signer)
      .deploy(...constructorParams);
    const deployedContract = await deployer.deployed();
    return deployedContract.address;
  }
}
