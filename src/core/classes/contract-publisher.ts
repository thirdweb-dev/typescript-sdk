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
import {
  ByocFactory,
  ByocFactory__factory,
  ByocRegistry,
  ByocRegistry__factory,
} from "@thirdweb-dev/contracts";
import { AddressZero } from "@ethersproject/constants";
import { ContractPublishedEvent } from "@thirdweb-dev/contracts/dist/ByocRegistry";
import { getBYOCFactoryAddress, getBYOCRegistryAddress } from "../../constants";
import {
  ContractDeployedEvent,
  ThirdwebContract,
} from "@thirdweb-dev/contracts/dist/ByocFactory";
import { CustomContractMetadata } from "../../schema";

/**
 * Handles publishing contracts (EXPERIMENTAL)
 * @internal
 */
export class ContractPublisher extends RPCConnectionHandler {
  private storage: IStorage;
  private registry: ContractWrapper<ByocRegistry>;
  private factory: ContractWrapper<ByocFactory>;

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
    this.factory = new ContractWrapper<ByocFactory>(
      network,
      getBYOCFactoryAddress(),
      ByocFactory__factory.abi,
      options,
    );
  }

  public override updateSignerOrProvider(
    network: NetworkOrSignerOrProvider,
  ): void {
    super.updateSignerOrProvider(network);
    this.registry.updateSignerOrProvider(network);
    this.factory.updateSignerOrProvider(network);
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
      ethers.utils.formatBytes32String(metadata.name), // TODO this shouldn't be bytes32
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
   * @param contractMetadata
   */
  public async deployCustomContract(
    contract: PublishedContract,
    constructorParamValues: any[],
    contractMetadata?: CustomContractMetadata,
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
    const paramValues = this.convertParamValues(
      constructorParamTypes,
      constructorParamValues,
    );
    const constructorParamsEncoded = ethers.utils.solidityPack(
      constructorParamTypes,
      paramValues,
    );
    let contractURI = "";
    if (contractMetadata) {
      contractURI = await this.storage.uploadMetadata(contractMetadata);
    }
    const receipt = await this.factory.sendTransaction("deployInstance", [
      publisher,
      bytecode,
      constructorParamsEncoded,
      salt,
      value,
      {
        publishMetadataUri: contract.metadataUri,
        contractURI,
      } as ThirdwebContract.ThirdwebInfoStruct,
    ]);
    const events = this.factory.parseLogs<ContractDeployedEvent>(
      "ContractDeployed",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ContractDeployed event found");
    }
    return events[0].args.deployedContract;
  }

  private convertParamValues(
    constructorParamTypes: string[],
    constructorParamValues: any[],
  ) {
    // check that both arrays are same length
    if (constructorParamTypes.length !== constructorParamValues.length) {
      throw Error("Passed the wrong number of constructor arguments");
    }
    return constructorParamTypes.map((p, index) => {
      if (p === "bytes32") {
        return ethers.utils.formatBytes32String(
          constructorParamValues[index].toString(),
        );
      }
      if (p.startsWith("bytes")) {
        return ethers.utils.toUtf8Bytes(
          constructorParamValues[index].toString(),
        );
      }
      if (p.startsWith("uint") || p.startsWith("int")) {
        return BigNumber.from(constructorParamValues[index].toString());
      }
      return constructorParamValues;
    });
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
