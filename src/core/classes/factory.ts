import { TWFactory, TWFactory__factory } from "@3rdweb/contracts";
import { BigNumber, ethers } from "ethers";
import { z } from "zod";
import {
  DropErc1155Module,
  DropErc721Module,
  MarketplaceModule,
  MODULES_MAP,
  PacksModule,
  SplitsModule,
  TokenErc1155Module,
  TokenErc20Module,
  VoteModule,
  TokenErc721Module,
} from "../../modules";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces/IStorage";
import { NetworkOrSignerOrProvider, ValidModuleClass } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { ProxyDeployedEvent } from "@3rdweb/contracts/dist/TWFactory";

import { ChainlinkVrf } from "../../constants/chainlink";

/**
 * @internal
 */
export class ModuleFactory extends ContractWrapper<TWFactory> {
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

  public async deploy<TModule extends ValidModuleClass>(
    moduleType: TModule["moduleType"],
    moduleMetadata: z.input<TModule["schema"]["deploy"]>,
  ) {
    const module = MODULES_MAP[moduleType];
    const metadata = module.schema.deploy.parse(moduleMetadata);
    const contractFactory = module.contractFactory;
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
        await this.getDeployArguments(moduleType, metadata, contractURI),
      );

    const encodedType = ethers.utils.formatBytes32String(moduleType);
    console.log(`Deploying ${moduleType} proxy`);
    const receipt = await this.sendTransaction("deployProxy", [
      encodedType,
      encodedFunc,
    ]);
    console.log(`${moduleType} proxy deployed successfully`);
    const events = this.parseLogs<ProxyDeployedEvent>(
      "ProxyDeployed",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ProxyDeployed event found");
    }

    return events[0].args.proxy;
  }

  // TODO generic function to generate deploy initialize arguments
  private async getDeployArguments<TModule extends ValidModuleClass>(
    moduleType: TModule["moduleType"],
    metadata: z.input<TModule["schema"]["deploy"]>,
    contractURI: string,
  ): Promise<any[]> {
    switch (moduleType) {
      case DropErc721Module.moduleType:
      case TokenErc721Module.moduleType:
        const erc721metadata = DropErc721Module.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          erc721metadata.name,
          erc721metadata.symbol,
          contractURI,
          erc721metadata.trusted_forwarder,
          erc721metadata.primary_sale_recipient,
          erc721metadata.fee_recipient,
          erc721metadata.seller_fee_basis_points,
          erc721metadata.platform_fee_basis_points,
          erc721metadata.platform_fee_recipient,
        ];
      case DropErc1155Module.moduleType:
      case TokenErc1155Module.moduleType:
        const erc1155metadata = DropErc1155Module.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          erc1155metadata.name,
          erc1155metadata.symbol,
          contractURI,
          erc1155metadata.trusted_forwarder,
          erc1155metadata.primary_sale_recipient,
          erc1155metadata.fee_recipient,
          erc1155metadata.seller_fee_basis_points,
          erc1155metadata.platform_fee_basis_points,
          erc1155metadata.platform_fee_recipient,
        ];
      case TokenErc20Module.moduleType:
        const erc20metadata = TokenErc20Module.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          erc20metadata.name,
          erc20metadata.symbol,
          contractURI,
          erc20metadata.trusted_forwarder,
        ];
      case VoteModule.moduleType:
        const voteMetadata = VoteModule.schema.deploy.parse(metadata);
        return [
          voteMetadata.name,
          contractURI,
          voteMetadata.trusted_forwarder,
          voteMetadata.voting_token_address,
          voteMetadata.voting_delay_in_blocks,
          voteMetadata.voting_period_in_blocks,
          BigNumber.from(voteMetadata.proposal_token_threshold),
          voteMetadata.voting_quorum_fraction,
        ];
      case SplitsModule.moduleType:
        const splitsMetadata = SplitsModule.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          contractURI,
          splitsMetadata.trusted_forwarder,
          splitsMetadata.recipientSplits.map((s) => s.address),
          splitsMetadata.recipientSplits.map((s) => s.shares),
        ];
      case MarketplaceModule.moduleType:
        const marketplaceMetadata =
          MarketplaceModule.schema.deploy.parse(metadata);
        return [
          await this.getSignerAddress(),
          contractURI,
          marketplaceMetadata.trusted_forwarder,
          marketplaceMetadata.platform_fee_recipient,
          marketplaceMetadata.platform_fee_basis_points,
        ];
      case PacksModule.moduleType:
        const packsMetadata = PacksModule.schema.deploy.parse(metadata);
        const vrf = ChainlinkVrf[await this.getChainID()];
        return [
          await this.getSignerAddress(),
          packsMetadata.name,
          packsMetadata.symbol,
          contractURI,
          packsMetadata.trusted_forwarder,
          packsMetadata.fee_recipient,
          packsMetadata.seller_fee_basis_points,
          vrf.fees,
          vrf.keyHash,
        ];
      default:
        return [];
    }
  }
}
