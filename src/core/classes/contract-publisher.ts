import { NetworkOrSignerOrProvider, TransactionResultWithId } from "../types";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces";
import { RPCConnectionHandler } from "./rpc-connection-handler";
import { BigNumber, BytesLike, ContractInterface, ethers } from "ethers";
import invariant from "tiny-invariant";
import {
  extractConstructorParams,
  extractConstructorParamsFromAbi,
  fetchContractMetadata,
} from "../../common/feature-detection";
import {
  ContractParam,
  PublishedContract,
  PublishedContractSchema,
} from "../../schema/contracts/custom";
import { solidityKeccak256 } from "ethers/lib/utils";
import { ContractWrapper } from "./contract-wrapper";
import { ByocRegistry, ByocRegistry__factory } from "@thirdweb-dev/contracts";
import { AddressZero } from "@ethersproject/constants";
import {
  ContractDeployedEvent,
  ContractPublishedEvent,
} from "@thirdweb-dev/contracts/dist/ByocRegistry";
import { getBYOCRegistryAddress } from "../../constants";

/**
 * Handles publishing contracts (EXPERIMENTAL)
 * @internal
 */
export class ContractPublisher extends RPCConnectionHandler {
  private storage: IStorage;
  private registry: ContractWrapper<ByocRegistry>;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage,
  ) {
    super(network, options);
    this.storage = storage;
    this.registry = new ContractWrapper<ByocRegistry>(
      network,
      getBYOCRegistryAddress(),
      ByocRegistry__factory.abi,
      options,
    );
  }

  public override updateSignerOrProvider(
    network: NetworkOrSignerOrProvider,
  ): void {
    super.updateSignerOrProvider(network);
    this.registry.updateSignerOrProvider(network);
  }

  /**
   * @internal
   * @param metadataUri
   */
  public async extractConstructorParams(
    metadataUri: string,
  ): Promise<ContractParam[]> {
    return extractConstructorParams(metadataUri, this.storage);
  }

  /**
   * @internal
   * @param metadataUri
   */
  public async fetchFullContractMetadata(metadataUri: string) {
    return fetchContractMetadata(metadataUri, this.storage);
  }

  public async getAll(publisherAddress: string): Promise<PublishedContract[]> {
    const data = await this.registry.readContract.getAllPublishedContracts(
      publisherAddress,
    );
    return data.map((d) =>
      PublishedContractSchema.parse({
        id: d.contractId,
        metadataUri: d.publishMetadataUri,
      }),
    );
  }

  public async get(
    publisherAddress: string,
    metadataUri: string,
  ): Promise<PublishedContract> {
    // TODO should be a single call to contract?
    // const all = await this.getAll(publisherAddress);
    // const contract = all.find((p) => p.metadataUri === metadataUri);
    // if (contract === undefined) {
    //   throw Error(
    //     `No contract found with uri: ${metadataUri} for publisher: ${publisherAddress}`,
    //   );
    // }
    const id = await this.registry.readContract.contractId(
      publisherAddress,
      metadataUri,
    );
    const contractStruct =
      await this.registry.readContract.getPublishedContract(
        publisherAddress,
        id,
      );
    return PublishedContractSchema.parse({
      id: contractStruct.contractId,
      metadataUri: contractStruct.publishMetadataUri,
    });
  }

  public async publish(
    metadataUri: string,
  ): Promise<TransactionResultWithId<PublishedContract>> {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const publisher = await signer.getAddress();
    const metadata = await this.fetchFullContractMetadata(metadataUri);
    const bytecodeHash = solidityKeccak256(["bytes"], [metadata.bytecode]);
    const receipt = await this.registry.sendTransaction("publishContract", [
      publisher,
      metadataUri,
      bytecodeHash,
      AddressZero,
    ]);
    const events = this.registry.parseLogs<ContractPublishedEvent>(
      "ContractPublished",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ContractDeployed event found");
    }
    const id = events[0].args.contractId;
    return { id, receipt, data: () => this.get(publisher, metadataUri) };
  }

  // TODO unpublish contract

  /**
   * @internal
   * @param contract
   * @param constructorParamValues
   */
  public async deployCustomContract(
    contract: PublishedContract,
    constructorParamValues: any[],
  ): Promise<string> {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const metadata = await this.fetchFullContractMetadata(contract.metadataUri);
    const publisher = await signer.getAddress();
    const bytecode = metadata.bytecode;
    const salt = ethers.utils.formatBytes32String("");
    const value = BigNumber.from(0);
    const constructorParamTypes = extractConstructorParamsFromAbi(
      metadata.abi,
    ).map((p) => p.type);
    const constructorParamsEncoded = ethers.utils.solidityPack(
      constructorParamTypes,
      constructorParamValues,
    );
    const receipt = await this.registry.sendTransaction("deployInstance", [
      publisher,
      contract.id,
      bytecode,
      constructorParamsEncoded,
      salt,
      value,
    ]);
    const events = this.registry.parseLogs<ContractDeployedEvent>(
      "ContractDeployed",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ContractDeployed event found");
    }
    return events[0].args.deployedContract;
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
