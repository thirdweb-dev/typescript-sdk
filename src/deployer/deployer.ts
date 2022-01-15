import {
  Coin__factory,
  LazyMintERC1155__factory,
  NFTCollection__factory,
  ThirdwebProxy,
  ThirdwebProxy__factory,
} from "@3rdweb/contracts";

import { JsonConvert } from "json2typescript";
import { ModuleType } from "../common/module-type";
import FileOrBuffer from "../types/FileOrBuffer";
import {
  BundleDropModuleMetadata,
  BundleModuleMetadata,
  DropModuleMetadata,
  MarketModuleMetadata,
  NftModuleMetadata,
  PackModuleMetadata,
  SplitsModuleMetadata,
  TokenModuleMetadata,
  VoteModuleMetadata,
} from "../types/module-deployments";
import MarketplaceModuleMetadata from "../types/module-deployments/MarketplaceModuleMetadata";
import { Module } from "../core/module";
import { FORWARDER_ADDRESS } from "../common/address";

type ModuleMetadaTypeMap = {
  TOKEN: TokenModuleMetadata;
  BUNDLE_COLLECTION: BundleModuleMetadata;
  NFT_COLLECTION: NftModuleMetadata;
  PACK: PackModuleMetadata;
  NFT_DROP: DropModuleMetadata;
  SPLITS: SplitsModuleMetadata;
  VOTE: VoteModuleMetadata;
  BUNDLE_DROP: BundleDropModuleMetadata;
  MARKETPLACE: MarketModuleMetadata;
};

function getMetadataClassForModuleType<TModuleType extends ModuleType>(
  moduleType: TModuleType,
) {
  if (moduleType === "BUNDLE_DROP") {
    return BundleDropModuleMetadata;
  } else if (moduleType === "TOKEN") {
    return TokenModuleMetadata;
  } else if (moduleType === "BUNDLE_COLLECTION") {
    return BundleModuleMetadata;
  } else if (moduleType === "NFT_COLLECTION") {
    return NftModuleMetadata;
  } else if (moduleType === "PACK") {
    return PackModuleMetadata;
  } else if (moduleType === "NFT_DROP") {
    return DropModuleMetadata;
  } else if (moduleType === "SPLITS") {
    return SplitsModuleMetadata;
  } else if (moduleType === "VOTE") {
    return VoteModuleMetadata;
  } else if (moduleType === "MARKETPLACE") {
    return MarketplaceModuleMetadata;
  }
  throw new Error("Unsupported module type");
}
/*
  if (moduleType === ModuleType.BUNDLE_DROP) {
    const {
      contractUri,
      primarySaleRecipient,
      royaltyReceipient,
      royaltyBPS,
      platformFeeBPS,
      platformFeeRecipient,
    } = deployParams;
    return ethers.utils.defaultAbiCoder.encode(
      ["string", ...TOKEN_ENCODE_TYPES_COMMON],
      [
        contractUri,
        FORWARDER_ADDRESS,
        primarySaleRecipient,
        royaltyReceipient,
        royaltyBPS,
        platformFeeBPS,
        platformFeeRecipient,
      ],
    );
  } else if (moduleType === ModuleType.TOKEN) {
    return ethers.utils.defaultAbiCoder.encode(
      [...NAME_SYMBOL_CONTRACT_URI, "address"],
      [name, symbol, contractUri, FORWARDER_ADDRESS],
    );
  } else if (moduleType === ModuleType.BUNDLE) {
    return ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint256"],
      [contractUri, FORWARDER_ADDRESS, royaltyReceipient, royaltyBPS],
    );
  } else if (moduleType === ModuleType.NFT) {
    return ethers.utils.defaultAbiCoder.encode(
      [...NAME_SYMBOL_CONTRACT_URI, ...TOKEN_ENCODE_TYPES_COMMON],
      [
        name,
        symbol,
        contractUri,
        FORWARDER_ADDRESS,
        primarySaleRecipient,
        royaltyReceipient,
        royaltyBPS,
        platformFeeBPS,
        platformFeeRecipient,
      ],
    );
  } else if (moduleType === ModuleType.PACK) {
    return ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint128", "uint128", "bytes32"],
      [
        contractUri,
        FORWARDER_ADDRESS,
        royaltyReceipient,
        royaltyBPS,
        chainLinkFees,
        chainLinkKeyHash,
      ],
    );
  } else if (moduleType === ModuleType.DROP) {
    return ethers.utils.defaultAbiCoder.encode(
      [...NAME_SYMBOL_CONTRACT_URI, ...TOKEN_ENCODE_TYPES_COMMON],
      [
        name,
        symbol,
        contractUri,
        FORWARDER_ADDRESS,
        primarySaleRecipient,
        royaltyReceipient,
        royaltyBPS,
        platformFeeBPS,
        platformFeeRecipient,
      ],
    );
  } else if (moduleType === ModuleType.SPLITS) {
    return ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address[]", "uint256[]"],
      [contractUri, FORWARDER_ADDRESS, shareHolders, shares],
    );
  } else if (moduleType === ModuleType.VOTE) {
    return ethers.utils.defaultAbiCoder.encode(
      [
        "string",
        "string",
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        name,
        contractUri,
        FORWARDER_ADDRESS,
        governanceTokenAddress,
        initialVotingDelay,
        initialVotingPeriod,
        initialProposalThreshold,
        initialVoteQuorumFraction,
      ],
    );
  } else if (moduleType === ModuleType.MARKETPLACE) {
    return ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint256"],
      [contractUri, FORWARDER_ADDRESS, marketFeeRecipient, marketFeeBPS],
    );
  }

  throw new Error("Unsupported module type") as never;
}
*/

/**
 * Access this module by calling {@link ThirdwebSDK.getAppModule}
 * @public
 */
export class Deployer extends Module<ThirdwebProxy> {
  private jsonConvert = new JsonConvert();

  protected connectContract(): ThirdwebProxy {
    return ThirdwebProxy__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * Helper method that handles `image` property uploads if its a file
   *
   * @param metadata - The metadata of the module to be deployed
   * @returns - The sanitized metadata with an uploaded image ipfs hash
   */
  private async _prepareMetadata<TModuleType extends ModuleType>(
    metadata: ModuleMetadaTypeMap[TModuleType],
  ) {
    if (typeof metadata.image === "string") {
      return Promise.resolve(metadata);
    }
    if (metadata.image === undefined) {
      return Promise.resolve(metadata);
    }

    metadata.image = await this.sdk
      .getStorage()
      .upload(
        metadata.image as FileOrBuffer,
        this.address,
        await this.getSignerAddress(),
      );
    return Promise.resolve(metadata);
  }

  /**
   * method that deploys a module and returns its address
   *
   * @public
   *
   * @param moduleType - The ModuleType to deploy
   * @param args - Constructor arguments for the module
   * @param factory - The ABI factory used to call the `deploy` method
   * @returns The address of the deployed module
   */
  public async deployModule<TModuleType extends ModuleType>(
    moduleType: TModuleType,
    metadata: ModuleMetadaTypeMap[TModuleType],
  ) {
    const serializedMetadata = this.jsonConvert.serializeObject<
      ModuleMetadaTypeMap[TModuleType]
    >(
      await this._prepareMetadata(metadata),
      getMetadataClassForModuleType(moduleType),
    );

    const contractUri = await this.sdk
      .getStorage()
      .uploadMetadata(
        serializedMetadata,
        this.address,
        await this.getSignerAddress(),
      );

    let encodedParams = "";
    switch (moduleType) {
      case "TOKEN": {
        encodedParams = Coin__factory.createInterface().encodeFunctionData(
          "initialize",
          [
            metadata.name,
            (metadata as TokenModuleMetadata).symbol,
            contractUri,
            FORWARDER_ADDRESS,
          ],
        );
        break;
      }
      case "BUNDLE_COLLECTION": {
        encodedParams =
          NFTCollection__factory.createInterface().encodeFunctionData(
            "initialize",
            [],
          );
        break;
      }
      case "BUNDLE_DROP": {
        encodedParams =
          LazyMintERC1155__factory.createInterface().encodeFunctionData(
            "initialize",
            [
              contractUri,
              FORWARDER_ADDRESS,
              (metadata as BundleDropModuleMetadata).primarySaleRecipient,
              (metadata as BundleDropModuleMetadata).royaltyReceipient,
              (metadata as BundleDropModuleMetadata).royaltyBPS,
              (metadata as BundleDropModuleMetadata).platformFeeBPS,
              (metadata as BundleDropModuleMetadata).platformFeeRecipient,
            ],
          );
        break;
      }
    }

    const tx = await this.contract.deployProxy(moduleType, encodedParams);
  }
}
