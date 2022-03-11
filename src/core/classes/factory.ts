import { TWFactory, TWFactory__factory } from "@thirdweb-dev/contracts";
import { BigNumber, ethers } from "ethers";
import { z } from "zod";
import {
  EditionDrop,
  Marketplace,
  CONTRACTS_MAP,
  Pack,
  Split,
  Edition,
  Token,
  Vote,
  NFTCollection,
  NFTDrop,
  REMOTE_CONTRACT_NAME,
} from "../../contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces/IStorage";
import { NetworkOrSignerOrProvider, ValidContractClass } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { ProxyDeployedEvent } from "@thirdweb-dev/contracts/dist/TWFactory";

import { ChainlinkVrf } from "../../constants/chainlink";
import {
  CONTRACT_ADDRESSES,
  OZ_DEFENDER_FORWARDER_ADDRESS,
  SUPPORTED_CHAIN_IDS,
} from "../../constants";

/**
 * @internal
 */
export class ContractFactory extends ContractWrapper<TWFactory> {
  private storage: IStorage;

  constructor(
    factoryAddr: string,
    network: NetworkOrSignerOrProvider,
    storage: IStorage,
    options?: SDKOptions,
  ) {
    super(network, factoryAddr, TWFactory__factory.abi, options);
    this.storage = storage;
  }

  public async deploy<TContract extends ValidContractClass>(
    contractType: TContract["contractType"],
    contractMetadata: z.input<TContract["schema"]["deploy"]>,
  ): Promise<string> {
    const contract = CONTRACTS_MAP[contractType];
    const metadata = contract.schema.deploy.parse(contractMetadata);
    const contractFactory = contract.contractFactory;

    // TODO: is there any special pre-processing we need to do before uploading?
    const contractURI = await this.storage.uploadMetadata(
      metadata,
      this.readContract.address,
      await this.getSigner()?.getAddress(),
    );

    const encodedFunc = contractFactory
      .getInterface(contractFactory.abi)
      .encodeFunctionData(
        "initialize",
        await this.getDeployArguments(contractType, metadata, contractURI),
      );

    const contractName = REMOTE_CONTRACT_NAME[contractType];
    console.log(`Remote contractName : ${contractName}`);
    const encodedType = ethers.utils.formatBytes32String(contractName);
    console.log(`Deploying ${contractType} proxy`);
    const receipt = await this.sendTransaction("deployProxy", [
      encodedType,
      encodedFunc,
    ]);
    console.log(`${contractType} proxy deployed successfully`);
    const events = this.parseLogs<ProxyDeployedEvent>(
      "ProxyDeployed",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ProxyDeployed event found");
    }

    return events[0].args.proxy;
  }

  private async getDeployArguments<TContract extends ValidContractClass>(
    contractType: TContract["contractType"],
    metadata: z.input<TContract["schema"]["deploy"]>,
    contractURI: string,
  ): Promise<any[]> {
    const defaultTrustedForwarders = await this.getDefaultTrustedForwarders();
    switch (contractType) {
      case NFTDrop.contractType:
      case NFTCollection.contractType:
        const erc721metadata = NFTDrop.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          erc721metadata.name,
          erc721metadata.symbol,
          contractURI,
          defaultTrustedForwarders.concat(erc721metadata.trusted_forwarders),
          erc721metadata.primary_sale_recipient,
          erc721metadata.fee_recipient,
          erc721metadata.seller_fee_basis_points,
          erc721metadata.platform_fee_basis_points,
          erc721metadata.platform_fee_recipient,
        ];
      case EditionDrop.contractType:
      case Edition.contractType:
        const erc1155metadata = EditionDrop.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          erc1155metadata.name,
          erc1155metadata.symbol,
          contractURI,
          defaultTrustedForwarders.concat(erc1155metadata.trusted_forwarders),
          erc1155metadata.primary_sale_recipient,
          erc1155metadata.fee_recipient,
          erc1155metadata.seller_fee_basis_points,
          erc1155metadata.platform_fee_basis_points,
          erc1155metadata.platform_fee_recipient,
        ];
      case Token.contractType:
        const erc20metadata = Token.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          erc20metadata.name,
          erc20metadata.symbol,
          contractURI,
          defaultTrustedForwarders.concat(erc20metadata.trusted_forwarders),
          erc20metadata.primary_sale_recipient,
          erc20metadata.platform_fee_recipient,
          erc20metadata.platform_fee_basis_points,
        ];
      case Vote.contractType:
        const voteMetadata = Vote.schema.deploy.parse(metadata);
        return [
          voteMetadata.name,
          contractURI,
          defaultTrustedForwarders.concat(voteMetadata.trusted_forwarders),
          voteMetadata.voting_token_address,
          voteMetadata.voting_delay_in_blocks,
          voteMetadata.voting_period_in_blocks,
          BigNumber.from(voteMetadata.proposal_token_threshold),
          voteMetadata.voting_quorum_fraction,
        ];
      case Split.contractType:
        const splitsMetadata = Split.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          contractURI,
          defaultTrustedForwarders.concat(splitsMetadata.trusted_forwarders),
          splitsMetadata.recipients.map((s) => s.address),
          splitsMetadata.recipients.map((s) => s.shares),
        ];
      case Marketplace.contractType:
        const marketplaceMetadata = Marketplace.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          contractURI,
          defaultTrustedForwarders.concat(
            marketplaceMetadata.trusted_forwarders,
          ),
          marketplaceMetadata.platform_fee_recipient,
          marketplaceMetadata.platform_fee_basis_points,
        ];
      case Pack.contractType:
        const packsMetadata = Pack.schema.deploy.parse(metadata);
        const vrf = ChainlinkVrf[await this.getChainID()];
        return [
          await this.getSignerAddress(),
          packsMetadata.name,
          packsMetadata.symbol,
          contractURI,
          defaultTrustedForwarders.concat(packsMetadata.trusted_forwarders),
          packsMetadata.fee_recipient,
          packsMetadata.seller_fee_basis_points,
          vrf.fees,
          vrf.keyHash,
        ];
      default:
        return [];
    }
  }

  private async getDefaultTrustedForwarders(): Promise<string[]> {
    const chainId = await this.getChainID();
    const chainEnum = SUPPORTED_CHAIN_IDS.find((c) => c === chainId);
    return chainEnum
      ? [
          OZ_DEFENDER_FORWARDER_ADDRESS,
          CONTRACT_ADDRESSES[chainEnum].biconomyForwarder,
        ]
      : [OZ_DEFENDER_FORWARDER_ADDRESS];
  }
}
