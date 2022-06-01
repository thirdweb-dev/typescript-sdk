import { NetworkOrSignerOrProvider, TransactionResult } from "../types";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces";
import { RPCConnectionHandler } from "./rpc-connection-handler";
import {
  BigNumber,
  BytesLike,
  constants,
  ContractInterface,
  ethers,
  utils,
} from "ethers";
import invariant from "tiny-invariant";
import {
  extractConstructorParams,
  extractConstructorParamsFromAbi,
  extractFunctions,
  fetchContractMetadataFromAddress,
  fetchPreDeployMetadata,
} from "../../common/feature-detection";
import {
  AbiFunction,
  ContractParam,
  PublishedContract,
  PublishedContractSchema,
} from "../../schema/contracts/custom";
import { ContractWrapper } from "./contract-wrapper";
import {
  ContractDeployer,
  ContractPublisher as OnChainContractPublisher,
  IContractPublisher,
} from "contracts";
import { getContractPublisherAddress } from "../../constants";
import ContractDeployerAbi from "../../../abis/ContractDeployer.json";
import ContractPublisherAbi from "../../../abis/ContractPublisher.json";
import { ContractPublishedEvent } from "contracts/ContractPublisher";

/**
 * Handles publishing contracts (EXPERIMENTAL)
 * @internal
 */
export class ContractPublisher extends RPCConnectionHandler {
  private storage: IStorage;
  private publisher: ContractWrapper<OnChainContractPublisher>;
  private factory: ContractWrapper<ContractDeployer>;

  constructor(
    contractDeployerAddress: string,
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage,
  ) {
    super(network, options);
    this.storage = storage;
    this.publisher = new ContractWrapper<OnChainContractPublisher>(
      network,
      getContractPublisherAddress(),
      ContractPublisherAbi,
      options,
    );
    this.factory = new ContractWrapper<ContractDeployer>(
      network,
      contractDeployerAddress,
      ContractDeployerAbi,
      options,
    );
  }

  public override updateSignerOrProvider(
    network: NetworkOrSignerOrProvider,
  ): void {
    super.updateSignerOrProvider(network);
    this.publisher.updateSignerOrProvider(network);
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
   * @param predeployMetadataUri
   */
  public async extractFunctions(
    predeployMetadataUri: string,
  ): Promise<AbiFunction[]> {
    return extractFunctions(predeployMetadataUri, this.storage);
  }

  public async fetchFullContractMetadataFromPredeployUri(predeployUri: string) {
    return fetchPreDeployMetadata(predeployUri, this.storage);
  }

  /**
   * @internal
   * @param address
   */
  public async fetchContractMetadataFromAddress(address: string) {
    return fetchContractMetadataFromAddress(
      address,
      this.getProvider(),
      this.storage,
    );
  }

  /**
   * @interface
   * @param publisherAddress
   */
  public async getAll(publisherAddress: string): Promise<PublishedContract[]> {
    const data = await this.publisher.readContract.getAllPublishedContracts(
      publisherAddress,
    );
    return data.map((d) => this.toPublishedContract(d));
  }

  /**
   * @internal
   * @param publisherAddress
   * @param contractId
   */
  public async getAllVersions(
    publisherAddress: string,
    contractId: string,
  ): Promise<PublishedContract[]> {
    const contractStructs =
      await this.publisher.readContract.getPublishedContractVersions(
        publisherAddress,
        contractId,
      );
    if (contractStructs.length === 0) {
      throw Error("Not found");
    }
    return contractStructs.map((d) => this.toPublishedContract(d));
  }

  public async getLatest(
    publisherAddress: string,
    contractId: string,
  ): Promise<PublishedContract> {
    const model = await this.publisher.readContract.getPublishedContract(
      publisherAddress,
      contractId,
    );
    return this.toPublishedContract(model);
  }

  public async publish(
    metadataUri: string,
  ): Promise<TransactionResult<PublishedContract>> {
    return (await this.publishBatch([metadataUri]))[0];
  }

  public async publishBatch(
    predeployUris: string[],
  ): Promise<TransactionResult<PublishedContract>[]> {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const publisher = await signer.getAddress();

    const fullMetadatas = await Promise.all(
      predeployUris.map(async (predeployUri) => {
        const fullMetadata =
          await this.fetchFullContractMetadataFromPredeployUri(predeployUri);
        return {
          bytecode: fullMetadata.bytecode.startsWith("0x")
            ? fullMetadata.bytecode
            : `0x${fullMetadata.bytecode}`,
          predeployUri,
          fullMetadata,
        };
      }),
    );

    const encoded = fullMetadatas.map((meta) => {
      const bytecodeHash = utils.solidityKeccak256(["bytes"], [meta.bytecode]);
      const contractId = meta.fullMetadata.name;
      return this.publisher.readContract.interface.encodeFunctionData(
        "publishContract",
        [
          publisher,
          meta.predeployUri,
          bytecodeHash,
          constants.AddressZero,
          contractId,
        ],
      );
    });
    const receipt = await this.publisher.multiCall(encoded);
    const events = this.publisher.parseLogs<ContractPublishedEvent>(
      "ContractPublished",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ContractDeployed event found");
    }
    return events.map((e) => {
      const contract = e.args.publishedContract;
      return {
        receipt,
        data: async () => this.toPublishedContract(contract),
      };
    });
  }

  // TODO unpublish contract

  /**
   * @internal
   * @param publisherAddress
   * @param contractId
   * @param constructorParamValues
   * @param contractMetadata
   */
  public async deployPublishedContract(
    publisherAddress: string,
    contractId: string,
    constructorParamValues: any[],
  ): Promise<string> {
    // TODO this gets the latest version, should we allow deploying a certain version?
    const contract = await this.publisher.readContract.getPublishedContract(
      publisherAddress,
      contractId,
    );
    return this.deployContract(
      contract.publishMetadataUri,
      constructorParamValues,
    );
  }

  /**
   * @internal
   * @param publishMetadataUri
   * @param constructorParamValues
   */
  public async deployContract(
    publishMetadataUri: string,
    constructorParamValues: any[],
  ) {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const metadata = await fetchPreDeployMetadata(
      publishMetadataUri,
      this.storage,
    );
    const bytecode = metadata.bytecode.startsWith("0x")
      ? metadata.bytecode
      : `0x${metadata.bytecode}`;
    if (!ethers.utils.isHexString(bytecode)) {
      throw new Error(`Contract bytecode is invalid.\n\n${bytecode}`);
    }
    const constructorParamTypes = extractConstructorParamsFromAbi(
      metadata.abi,
    ).map((p) => p.type);
    const paramValues = this.convertParamValues(
      constructorParamTypes,
      constructorParamValues,
    );

    return this.deployContractWithAbi(metadata.abi, bytecode, paramValues);
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
      if (p.endsWith("[]")) {
        if (typeof constructorParamValues[index] === "string") {
          return JSON.parse(constructorParamValues[index]);
        } else {
          return constructorParamValues[index];
        }
      }
      if (p === "bytes32") {
        invariant(
          ethers.utils.isHexString(constructorParamValues[index]),
          `Could not parse bytes32 value. Expected valid hex string but got "${constructorParamValues[index]}".`,
        );
        if (ethers.utils.isHexString(constructorParamValues[index])) {
          return ethers.utils.hexZeroPad(constructorParamValues[index], 32);
        }
      }
      if (p.startsWith("bytes")) {
        invariant(
          ethers.utils.isHexString(constructorParamValues[index]),
          `Could not parse bytes value. Expected valid hex string but got "${constructorParamValues[index]}".`,
        );
        return ethers.utils.toUtf8Bytes(constructorParamValues[index]);
      }
      if (p.startsWith("uint") || p.startsWith("int")) {
        return BigNumber.from(constructorParamValues[index].toString());
      }
      return constructorParamValues[index];
    });
  }

  /**
   * @internal
   * @param abi
   * @param bytecode
   * @param constructorParams
   */
  public async deployContractWithAbi(
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
    // TODO parse transaction receipt
    return deployedContract.address;
  }

  private toPublishedContract(
    contractModel: IContractPublisher.CustomContractInstanceStruct,
  ) {
    return PublishedContractSchema.parse({
      id: contractModel.contractId,
      timestamp: contractModel.publishTimestamp,
      metadataUri: contractModel.publishMetadataUri, // TODO download
    });
  }
}
