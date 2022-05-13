import { NetworkOrSignerOrProvider, TransactionResult } from "../types";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces";
import { RPCConnectionHandler } from "./rpc-connection-handler";
import {
  BigNumber,
  BytesLike,
  constants,
  Contract,
  ContractInterface,
  ethers,
  utils,
} from "ethers";
import invariant from "tiny-invariant";
import {
  extractConstructorParams,
  extractConstructorParamsFromAbi,
  extractFunctions,
  fetchContractMetadata,
} from "../../common/feature-detection";
import {
  AbiFunction,
  ContractParam,
  CustomContractMetadata,
  CustomContractMetadataSchema,
  PublishedContract,
  PublishedContractSchema,
} from "../../schema/contracts/custom";
import { ContractWrapper } from "./contract-wrapper";
import {
  ByocFactory,
  ByocFactory__factory,
  ByocRegistry,
  ByocRegistry__factory,
  IByocRegistry,
  ThirdwebContract as TWContract,
  ThirdwebContract__factory,
} from "contracts";
import { getBYOCRegistryAddress } from "../../constants";
import { ContractPublishedEvent } from "contracts/ByocRegistry";
import { ContractDeployedEvent } from "contracts/ByocFactory";

/**
 * Handles publishing contracts (EXPERIMENTAL)
 * @internal
 */
export class ContractPublisher extends RPCConnectionHandler {
  private storage: IStorage;
  private registry: ContractWrapper<ByocRegistry>;
  private factory: ContractWrapper<ByocFactory>;

  constructor(
    byocFactoryAddress: string,
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
      byocFactoryAddress,
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
  public async extractFunctions(metadataUri: string): Promise<AbiFunction[]> {
    return extractFunctions(metadataUri, this.storage);
  }

  /**
   * @internal
   * @param metadataUri
   */
  public async fetchFullContractMetadata(metadataUri: string) {
    return fetchContractMetadata(metadataUri, this.storage);
  }

  /**
   * @internal
   * @param address
   */
  public async fetchContractMetadataFromAddress(address: string) {
    const contract = new Contract(
      address,
      ThirdwebContract__factory.abi,
      // this is a *READ ONLY* operation. it *always* has to happen on the readOnly network (provider is fine here for the moment as a substitute)
      this.getProvider(),
    ) as TWContract;
    const metadataUri = await contract.getPublishMetadataUri();
    return await this.fetchFullContractMetadata(metadataUri);
  }

  /**
   * @interface
   * @param publisherAddress
   */
  public async getAll(publisherAddress: string): Promise<PublishedContract[]> {
    const data = await this.registry.readContract.getAllPublishedContracts(
      publisherAddress,
    );
    return data
      .filter((d) => d.publishTimestamp) // TODO (byoc) remove this before going to prod
      .map((d) => this.toPublishedContract(d));
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
      await this.registry.readContract.getPublishedContractVersions(
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
    const model = await this.registry.readContract.getPublishedContract(
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
    metadataUris: string[],
  ): Promise<TransactionResult<PublishedContract>[]> {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const publisher = await signer.getAddress();

    const fullMetadatas = await Promise.all(
      metadataUris.map(async (uri) => ({
        uri,
        fullMetadata: await this.fetchFullContractMetadata(uri),
      })),
    );

    const encoded = fullMetadatas.map((meta) => {
      const bytecodeHash = utils.solidityKeccak256(
        ["bytes"],
        [meta.fullMetadata.bytecode],
      );
      const contractId = meta.fullMetadata.name;
      return this.registry.readContract.interface.encodeFunctionData(
        "publishContract",
        [publisher, meta.uri, bytecodeHash, constants.AddressZero, contractId],
      );
    });
    const receipt = await this.registry.multiCall(encoded);
    const events = this.registry.parseLogs<ContractPublishedEvent>(
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
    contractMetadata?: CustomContractMetadata,
  ): Promise<string> {
    // TODO this gets the latest version, should we allow deploying a certain version?
    const contract = await this.registry.readContract.getPublishedContract(
      publisherAddress,
      contractId,
    );
    return this.deployContract(
      contract.publishMetadataUri,
      constructorParamValues,
      contractMetadata,
    );
  }

  /**
   * @internal
   * @param publishMetadataUri
   * @param constructorParamValues
   * @param contractMetadata
   */
  public async deployContract(
    publishMetadataUri: string,
    constructorParamValues: any[],
    contractMetadata?: CustomContractMetadata,
  ) {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const unwrappedMetadata = CustomContractMetadataSchema.parse(
      await this.storage.get(publishMetadataUri),
    );
    const metadata = await this.fetchFullContractMetadata(publishMetadataUri);
    const publisher = await signer.getAddress();
    const bytecode = metadata.bytecode.startsWith("0x")
      ? metadata.bytecode
      : `0x${metadata.bytecode}`;
    if (!ethers.utils.isHexString(bytecode)) {
      throw new Error(`Contract bytecode is invalid.\n\n${bytecode}`);
    }
    const salt = ethers.utils.formatBytes32String(Math.random().toString()); // TODO expose as optional
    const value = BigNumber.from(0);
    const constructorParamTypes = extractConstructorParamsFromAbi(
      metadata.abi,
    ).map((p) => p.type);
    const paramValues = this.convertParamValues(
      constructorParamTypes,
      constructorParamValues,
    );
    const constructorParamsEncoded = ethers.utils.defaultAbiCoder.encode(
      constructorParamTypes,
      paramValues,
    );
    const deployMetadata = {
      ...unwrappedMetadata,
      deployMetadata: contractMetadata || {},
      deployTimestamp: new Date().toISOString(),
    };
    const populatedContractUri = await this.storage.uploadMetadata(
      deployMetadata,
    );
    const receipt = await this.factory.sendTransaction("deployInstance", [
      publisher,
      bytecode,
      constructorParamsEncoded,
      salt,
      value,
      populatedContractUri,
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
      if (p.endsWith("[]")) {
        if (typeof constructorParamValues[index] === "string") {
          return JSON.parse(constructorParamValues[index]);
        } else {
          return constructorParamValues[index];
        }
      }
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
    return deployedContract.address;
  }

  private toPublishedContract(
    contractModel: IByocRegistry.CustomContractInstanceStruct,
  ) {
    return PublishedContractSchema.parse({
      id: contractModel.contractId,
      timestamp: contractModel.publishTimestamp,
      metadataUri: contractModel.publishMetadataUri, // TODO download
    });
  }
}
