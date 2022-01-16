import {
  Coin__factory,
  LazyMintERC1155__factory,
  LazyMintERC721__factory,
  Marketplace__factory,
  NFTCollection__factory,
  Pack__factory,
  SignatureMint721__factory,
  Splits__factory,
  ThirdwebFactory,
  ThirdwebFactory__factory,
  VotingGovernor__factory,
} from "@3rdweb/contracts";

import { ModuleType } from "../common/module-type";
import FileOrBuffer from "../types/FileOrBuffer";

import { Module } from "../core/module";

import {
  DeployBundleDropModuleMetadata,
  DeployTokenModuleMetadata,
  DeployNFTCollectionModuleMetadata,
  DeployNFTDropModuleMetadata,
  DeployBundleCollectionMetadata,
  DeploySplitsModuleMetadata,
  DeployVoteModuleMetadata,
  DeployMarketplaceModuleMetadata,
  DeployPackModuleMetadata,
} from "../schema";
import { SUPPORTED_CHAIN_ID } from "../common/chain";
import { DEFAULT_BLOCK_TIMES_FALLBACK } from "../utils/blockTimeEstimator";
import { ChainlinkVrf } from "../common/chainlink";

type ModuleMetadataTypeMap = {
  TOKEN: DeployTokenModuleMetadata;
  BUNDLE_COLLECTION: DeployBundleCollectionMetadata;
  NFT_COLLECTION: DeployNFTCollectionModuleMetadata;
  PACK: DeployPackModuleMetadata;
  NFT_DROP: DeployNFTDropModuleMetadata;
  SPLITS: DeploySplitsModuleMetadata;
  VOTE: DeployVoteModuleMetadata;
  BUNDLE_DROP: DeployBundleDropModuleMetadata;
  MARKETPLACE: DeployMarketplaceModuleMetadata;
};

function getMetadataClassForModuleType<TModuleType extends ModuleType>(
  moduleType: TModuleType,
) {
  if (moduleType === "BUNDLE_DROP") {
    return DeployBundleDropModuleMetadata;
  } else if (moduleType === "TOKEN") {
    return DeployTokenModuleMetadata;
  } else if (moduleType === "BUNDLE_COLLECTION") {
    return DeployBundleCollectionMetadata;
  } else if (moduleType === "NFT_COLLECTION") {
    return DeployNFTCollectionModuleMetadata;
  } else if (moduleType === "PACK") {
    return DeployPackModuleMetadata;
  } else if (moduleType === "NFT_DROP") {
    return DeployNFTDropModuleMetadata;
  } else if (moduleType === "SPLITS") {
    return DeploySplitsModuleMetadata;
  } else if (moduleType === "VOTE") {
    return DeployVoteModuleMetadata;
  } else if (moduleType === "MARKETPLACE") {
    return DeployMarketplaceModuleMetadata;
  }
  throw new Error("Unsupported module type");
}

/**
 * Access this module by calling {@link ThirdwebSDK.getAppModule}
 * @public
 */
export class Deployer extends Module<ThirdwebFactory, any> {
  protected connectContract(): ThirdwebFactory {
    return ThirdwebFactory__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  /**
   * Helper method that handles `image` property uploads if its a file
   *
   * @param metadata - The metadata of the module to be deployed
   * @returns - The sanitized metadata with an uploaded image ipfs hash
   */
  private async _prepareMetadata<TModuleType extends ModuleType>(
    metadata: ModuleMetadataTypeMap[TModuleType],
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
    metadata: ModuleMetadataTypeMap[TModuleType],
  ) {
    const serializedMetadata = this.jsonConvert.serializeObject<
      ModuleMetadataTypeMap[TModuleType]
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
        // will be called TokenERC20
        encodedParams = Coin__factory.createInterface().encodeFunctionData(
          "initialize",
          [
            metadata.name,
            (metadata as DeployTokenModuleMetadata).symbol,
            contractUri,
            (metadata as DeployTokenModuleMetadata).trustedForwarderAddress,
          ],
        );
        break;
      }
      case "BUNDLE_COLLECTION": {
        encodedParams =
          // will be called CollectionERC1155
          NFTCollection__factory.createInterface().encodeFunctionData(
            "initialize",
            [
              contractUri,
              (metadata as DeployBundleCollectionMetadata)
                .trustedForwarderAddress,
              (metadata as DeployBundleCollectionMetadata).royaltyReceipient,
              (metadata as DeployBundleCollectionMetadata).royaltyBps,
            ],
          );
        break;
      }
      case "BUNDLE_DROP": {
        encodedParams =
          // will be called LazyMintERC1155
          LazyMintERC1155__factory.createInterface().encodeFunctionData(
            "initialize",
            [
              contractUri,
              (metadata as DeployBundleDropModuleMetadata)
                .trustedForwarderAddress,
              (metadata as DeployBundleDropModuleMetadata).primarySaleRecipient,
              (metadata as DeployBundleDropModuleMetadata).royaltyReceipient,
              (metadata as DeployBundleDropModuleMetadata).royaltyBps,
              (metadata as DeployBundleDropModuleMetadata).platformFeeBps,
              (metadata as DeployBundleDropModuleMetadata).platformFeeRecipient,
            ],
          );
        break;
      }
      case "NFT_COLLECTION": {
        encodedParams =
          // will be called SignatureMintERC721
          SignatureMint721__factory.createInterface().encodeFunctionData(
            "intialize",
            [
              (metadata as DeployNFTCollectionModuleMetadata).name,
              (metadata as DeployNFTCollectionModuleMetadata).symbol,
              contractUri,
              (metadata as DeployNFTCollectionModuleMetadata)
                .trustedForwarderAddress,
              (metadata as DeployNFTCollectionModuleMetadata)
                .primarySaleRecipient,
              (metadata as DeployNFTCollectionModuleMetadata).royaltyReceipient,
              (metadata as DeployNFTCollectionModuleMetadata).royaltyBps,
              (metadata as DeployNFTCollectionModuleMetadata).platformFeeBps,
              (metadata as DeployNFTCollectionModuleMetadata)
                .platformFeeRecipient,
            ],
          );
        break;
      }
      case "NFT_DROP": {
        encodedParams =
          // will be called LazyMintERC721
          LazyMintERC721__factory.createInterface().encodeFunctionData(
            "initialize",
            [
              (metadata as DeployNFTDropModuleMetadata).name,
              (metadata as DeployNFTDropModuleMetadata).symbol,
              contractUri,
              (metadata as DeployNFTDropModuleMetadata).trustedForwarderAddress,
              (metadata as DeployNFTDropModuleMetadata).primarySaleRecipient,
              (metadata as DeployNFTDropModuleMetadata).royaltyReceipient,
              (metadata as DeployNFTDropModuleMetadata).royaltyBps,
              (metadata as DeployNFTDropModuleMetadata).platformFeeBps,
              (metadata as DeployNFTDropModuleMetadata).platformFeeRecipient,
            ],
          );
        break;
      }
      case "SPLITS": {
        encodedParams =
          // will be called Splits
          Splits__factory.createInterface().encodeFunctionData("initialize", [
            contractUri,
            (metadata as DeploySplitsModuleMetadata).trustedForwarderAddress,
            (metadata as DeploySplitsModuleMetadata).recipientSplits.map(
              (r) => r.address,
            ),
            (metadata as DeploySplitsModuleMetadata).recipientSplits.map(
              (r) => r.shares,
            ),
          ]);
        break;
      }
      case "VOTE": {
        const chainId = await this.getChainID();
        const timeBetweenBlocks =
          DEFAULT_BLOCK_TIMES_FALLBACK[chainId as SUPPORTED_CHAIN_ID];

        const waitTimeInBlocks = Math.ceil(
          (metadata as DeployVoteModuleMetadata)
            .proposalStartWaitTimeInSeconds /
            timeBetweenBlocks.secondsBetweenBlocks,
        );
        const votingTimeInBlocks = Math.ceil(
          (metadata as DeployVoteModuleMetadata).proposalVotingTimeInSeconds /
            timeBetweenBlocks.secondsBetweenBlocks,
        );
        encodedParams =
          // will be called Vote
          VotingGovernor__factory.createInterface().encodeFunctionData(
            "initialize",
            [
              (metadata as DeployVoteModuleMetadata).name,
              contractUri,
              (metadata as DeployVoteModuleMetadata).trustedForwarderAddress,
              (metadata as DeployVoteModuleMetadata).votingTokenAddress,
              waitTimeInBlocks,
              votingTimeInBlocks,
              (metadata as DeployVoteModuleMetadata)
                .minimumNumberOfTokensNeededToPropose,
              (metadata as DeployVoteModuleMetadata).votingQuorumFraction,
            ],
          );
        break;
      }
      case "MARKETPLACE": {
        encodedParams =
          // will be called Marketplace
          Marketplace__factory.createInterface().encodeFunctionData(
            "initialize",
            [
              contractUri,
              (metadata as DeployMarketplaceModuleMetadata)
                .trustedForwarderAddress,
              (metadata as DeployMarketplaceModuleMetadata)
                .platformFeeRecipient,
              (metadata as DeployMarketplaceModuleMetadata).platformFeeBps,
            ],
          );
        break;
      }
      case "PACK": {
        const chainId = await this.getChainID();
        const { keyHash, fees } =
          ChainlinkVrf[chainId as keyof typeof ChainlinkVrf];
        encodedParams =
          // will be called Pack
          Pack__factory.createInterface().encodeFunctionData("initialize", [
            contractUri,
            (metadata as DeployPackModuleMetadata).trustedForwarderAddress,
            (metadata as DeployPackModuleMetadata).royaltyReceipient,
            (metadata as DeployPackModuleMetadata).royaltyBps,
            fees,
            keyHash,
          ]);
        break;
      }
      default: {
        throw new Error(
          `Trying to deploy unknown module with type: ${moduleType}`,
        );
      }
    }

    const tx = await this.contract.deployProxy(moduleType, encodedParams);
    await tx.wait();
    return tx;
  }
}
