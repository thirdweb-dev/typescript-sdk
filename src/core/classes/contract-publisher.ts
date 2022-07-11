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
  fetchRawPredeployMetadata,
  fetchSourceFilesFromMetadata,
  resolveContractUriFromAddress,
} from "../../common/feature-detection";
import {
  AbiFunction,
  ContractParam,
  ContractSource,
  ExtraPublishMetadata,
  FullPublishMetadata,
  FullPublishMetadataSchema,
  PreDeployMetadataFetched,
  ProfileMetadata,
  ProfileSchema,
  PublishedContract,
  PublishedContractFetched,
  PublishedContractSchema,
} from "../../schema/contracts/custom";
import { ContractWrapper } from "./contract-wrapper";
import {
  ContractPublisher as OnChainContractPublisher,
  IContractPublisher,
} from "contracts";
import { getContractPublisherAddress } from "../../constants";
import ContractPublisherAbi from "../../../abis/ContractPublisher.json";
import { ContractPublishedEvent } from "contracts/ContractPublisher";
import { isIncrementalVersion } from "../../common/version-checker";

/**
 * Handles publishing contracts (EXPERIMENTAL)
 * @internal
 */
export class ContractPublisher extends RPCConnectionHandler {
  private storage: IStorage;
  private publisher: ContractWrapper<OnChainContractPublisher>;

  constructor(
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
  }

  public override updateSignerOrProvider(
    network: NetworkOrSignerOrProvider,
  ): void {
    super.updateSignerOrProvider(network);
    this.publisher.updateSignerOrProvider(network);
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

  /**
   * @internal
   * @param predeployUri
   */
  public async fetchCompilerMetadataFromPredeployURI(
    predeployUri: string,
  ): Promise<PreDeployMetadataFetched> {
    return fetchPreDeployMetadata(predeployUri, this.storage);
  }

  /**
   * @internal
   * @param prepublishUri
   * @param publisherAddress
   */
  public async fetchPrePublishMetadata(
    prepublishUri: string,
    publisherAddress: string,
  ): Promise<{
    preDeployMetadata: PreDeployMetadataFetched;
    latestPublishedContractMetadata?: PublishedContractFetched;
  }> {
    const preDeployMetadataFetched = await fetchPreDeployMetadata(
      prepublishUri,
      this.storage,
    );
    const latestPublishedContract = publisherAddress
      ? await this.getLatest(publisherAddress, preDeployMetadataFetched.name)
      : undefined;
    const latestPublishedContractMetadata = latestPublishedContract
      ? await this.fetchPublishedContractInfo(latestPublishedContract)
      : undefined;
    return {
      preDeployMetadata: preDeployMetadataFetched,
      latestPublishedContractMetadata,
    };
  }

  /**
   * @internal
   * @param address
   */
  public async fetchCompilerMetadataFromAddress(address: string) {
    return fetchContractMetadataFromAddress(
      address,
      this.getProvider(),
      this.storage,
    );
  }

  /**
   * @internal
   * Get the full information about a published contract
   * @param contract
   */
  public async fetchPublishedContractInfo(
    contract: PublishedContract,
  ): Promise<PublishedContractFetched> {
    return {
      name: contract.id,
      publishedTimestamp: contract.timestamp,
      publishedMetadata: await this.fetchPublishedMetadata(
        contract.metadataUri,
      ),
    };
  }

  /**
   * @internal
   * @param publishedMetadataUri
   */
  public async fetchPublishedMetadata(
    publishedMetadataUri: string,
  ): Promise<FullPublishMetadata> {
    const meta = await this.storage.getRaw(publishedMetadataUri);
    return FullPublishMetadataSchema.parse(JSON.parse(meta));
  }

  /**
   * @internal
   * @param address
   */
  public async resolvePublishMetadataFromAddress(
    address: string,
  ): Promise<FullPublishMetadata[]> {
    const compilerMetadataUri = await resolveContractUriFromAddress(
      address,
      this.getProvider(),
    );
    if (!compilerMetadataUri) {
      throw Error("Could not resolve compiler metadata URI from bytecode");
    }
    const publishedMetadataUri =
      await this.publisher.readContract.getPublishedUriFromCompilerUri(
        compilerMetadataUri,
      );
    if (publishedMetadataUri.length === 0) {
      throw Error(`Could not resolve published metadata URI from ${address}`);
    }
    return await Promise.all(
      publishedMetadataUri.map((uri) => this.fetchPublishedMetadata(uri)),
    );
  }

  /**
   * @internal
   * @param address
   */
  public async fetchContractSourcesFromAddress(
    address: string,
  ): Promise<ContractSource[]> {
    const metadata = await this.fetchCompilerMetadataFromAddress(address);
    return await fetchSourceFilesFromMetadata(metadata, this.storage);
  }

  /**
   * @internal
   * @param profileMetadata
   */
  public async updatePublisherProfile(
    profileMetadata: ProfileMetadata,
  ): Promise<TransactionResult> {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const publisher = await signer.getAddress();
    const profileUri = await this.storage.uploadMetadata(profileMetadata);
    return {
      receipt: await this.publisher.sendTransaction("setPublisherProfileUri", [
        publisher,
        profileUri,
      ]),
    };
  }

  /**
   * @internal
   * @param publisherAddress
   */
  public async getPublisherProfile(
    publisherAddress: string,
  ): Promise<ProfileMetadata> {
    const profileUri = await this.publisher.readContract.getPublisherProfileUri(
      publisherAddress,
    );
    if (!profileUri || profileUri.length === 0) {
      return {};
    }
    return ProfileSchema.parse(await this.storage.get(profileUri));
  }

  /**
   * @internal
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
    predeployUri: string,
    extraMetadata: ExtraPublishMetadata,
  ): Promise<TransactionResult<PublishedContract>> {
    const signer = this.getSigner();
    invariant(signer, "A signer is required");
    const publisher = await signer.getAddress();

    const predeployMetadata = await fetchRawPredeployMetadata(
      predeployUri,
      this.storage,
    );

    // ensure version is incremental
    const latestContract = await this.getLatest(
      publisher,
      predeployMetadata.name,
    );
    if (latestContract && latestContract.metadataUri) {
      const latestMetadata = await this.fetchPublishedContractInfo(
        latestContract,
      );
      const latestVersion = latestMetadata.publishedMetadata.version;
      if (!isIncrementalVersion(latestVersion, extraMetadata.version)) {
        throw Error(
          `Version ${extraMetadata.version} is not greater than ${latestVersion}`,
        );
      }
    }

    const fetchedBytecode = await this.storage.getRaw(
      predeployMetadata.bytecodeUri,
    );
    const bytecode = fetchedBytecode.startsWith("0x")
      ? fetchedBytecode
      : `0x${fetchedBytecode}`;

    const bytecodeHash = utils.solidityKeccak256(["bytes"], [bytecode]);
    const contractId = predeployMetadata.name;

    const fullMetadata = FullPublishMetadataSchema.parse({
      ...predeployMetadata,
      ...extraMetadata,
      publisher,
    });
    const fullMetadataUri = await this.storage.uploadMetadata(fullMetadata);
    const receipt = await this.publisher.sendTransaction("publishContract", [
      publisher,
      contractId,
      fullMetadataUri,
      predeployMetadata.metadataUri,
      bytecodeHash,
      constants.AddressZero,
    ]);
    const events = this.publisher.parseLogs<ContractPublishedEvent>(
      "ContractPublished",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ContractPublished event found");
    }
    const contract = events[0].args.publishedContract;
    return {
      receipt,
      data: async () => this.toPublishedContract(contract),
    };
  }

  public async unpublish(
    publisher: string,
    contractId: string,
  ): Promise<TransactionResult> {
    return {
      receipt: await this.publisher.sendTransaction("unpublishContract", [
        publisher,
        contractId,
      ]),
    };
  }

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
      if (p === "tuple" || p.endsWith("[]")) {
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
        return ethers.utils.hexZeroPad(constructorParamValues[index], 32);
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
  ): PublishedContract {
    return PublishedContractSchema.parse({
      id: contractModel.contractId,
      timestamp: contractModel.publishTimestamp,
      metadataUri: contractModel.publishMetadataUri,
    });
  }
}
