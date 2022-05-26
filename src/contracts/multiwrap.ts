import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import { Erc721 } from "../core/classes/erc-721";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { GasCostEstimator } from "../core/classes/gas-cost-estimator";
import { NFTMetadataOrUri, NFTMetadataOwner, SDKOptions } from "../schema";
import { Multiwrap as MultiwrapContract } from "contracts";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { uploadOrExtractURI } from "../common/nft";
import {
  ERC1155Wrappable,
  ERC20Wrappable,
  ERC721Wrappable,
  TokensToWrap,
} from "../types/multiwrap";
import { normalizePriceValue } from "../common/currency";
import { ITokenBundle, TokensWrappedEvent } from "contracts/Multiwrap";
import { MultiwrapContractSchema } from "../schema/contracts/multiwrap";
import { BigNumberish, ethers } from "ethers";
import TokenStruct = ITokenBundle.TokenStruct;

/**
 * Multiwrap lets you wrap arbitrary ERC20, ERC721 and ERC1155 tokens you own into a single wrapped token / NFT.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * const sdk = new ThirdwebSDK("rinkeby");
 * const contract = sdk.getMultiwrap("{{contract_address}}");
 * ```
 *
 * @internal
 */
export class Multiwrap extends Erc721<MultiwrapContract> {
  static contractType = "multiwrap" as const;
  static contractRoles = ["transfer", "minter", "unwrap", "asset"] as const;
  static contractAbi = require("../../abis/Multiwrap.json");

  /**
   * @internal
   */
  static schema = MultiwrapContractSchema;

  public encoder: ContractEncoder<MultiwrapContract>;
  public estimator: GasCostEstimator<MultiwrapContract>;
  public metadata: ContractMetadata<MultiwrapContract, typeof Multiwrap.schema>;
  public events: ContractEvents<MultiwrapContract>;
  public roles: ContractRoles<
    MultiwrapContract,
    typeof Multiwrap.contractRoles[number]
  >;

  /**
   * Configure royalties
   * @remarks Set your own royalties for the entire contract or per token
   * @example
   * ```javascript
   * // royalties on the whole contract
   * contract.royalty.setDefaultRoyaltyInfo({
   *   seller_fee_basis_points: 100, // 1%
   *   fee_recipient: "0x..."
   * });
   * // override royalty for a particular token
   * contract.royalty.setTokenRoyaltyInfo(tokenId, {
   *   seller_fee_basis_points: 500, // 5%
   *   fee_recipient: "0x..."
   * });
   * ```
   */
  public royalty: ContractRoyalty<MultiwrapContract, typeof Multiwrap.schema>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<MultiwrapContract>(
      network,
      address,
      Multiwrap.contractAbi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      Multiwrap.schema,
      this.storage,
    );

    this.roles = new ContractRoles(
      this.contractWrapper,
      Multiwrap.contractRoles,
    );
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
  }

  public async wrap(
    contents: TokensToWrap,
    wrappedTokenMetadata: NFTMetadataOrUri,
    recipientAddress?: string,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const uri = await uploadOrExtractURI(wrappedTokenMetadata, this.storage);

    const recipient = recipientAddress
      ? recipientAddress
      : await this.contractWrapper.getSignerAddress();

    const tokens: TokenStruct[] = [];

    const provider = this.contractWrapper.getProvider();

    if (contents.erc20Tokens) {
      for (const erc20 of contents.erc20Tokens) {
        tokens.push({
          assetContract: erc20.contractAddress,
          totalAmount: await normalizePriceValue(
            provider,
            erc20.tokenAmount,
            erc20.contractAddress,
          ),
          tokenId: 0,
          tokenType: 0,
        });
      }
    }

    if (contents.erc721Tokens) {
      for (const erc721 of contents.erc721Tokens) {
        tokens.push({
          assetContract: erc721.contractAddress,
          totalAmount: 0,
          tokenId: erc721.tokenId,
          tokenType: 1,
        });
      }
    }

    if (contents.erc1155Tokens) {
      for (const erc1155 of contents.erc1155Tokens) {
        tokens.push({
          assetContract: erc1155.contractAddress,
          totalAmount: erc1155.tokenAmount,
          tokenId: erc1155.tokenId,
          tokenType: 2,
        });
      }
    }

    const receipt = await this.contractWrapper.sendTransaction("wrap", [
      tokens,
      uri,
      recipient,
    ]);

    const event = this.contractWrapper.parseLogs<TokensWrappedEvent>(
      "TokensWrapped",
      receipt?.logs,
    );
    if (event.length === 0) {
      throw new Error("TokenMinted event not found");
    }
    const tokenId = event[0].args.tokenIdOfWrappedToken;
    return {
      id: tokenId,
      receipt,
      data: () => this.get(tokenId),
    };
  }

  public async getWrappedContents(
    wrappedTokenId: BigNumberish,
  ): Promise<TokensToWrap> {
    const wrappedTokens =
      await this.contractWrapper.readContract.getWrappedContents(
        wrappedTokenId,
      );

    const erc20Tokens: ERC20Wrappable[] = [];
    const erc721Tokens: ERC721Wrappable[] = [];
    const erc1155Tokens: ERC1155Wrappable[] = [];

    for (const token of wrappedTokens) {
      switch (token.tokenType) {
        case 0: {
          erc20Tokens.push({
            contractAddress: token.assetContract,
            tokenAmount: ethers.utils.formatEther(token.totalAmount),
          });
          break;
        }
        case 1: {
          erc721Tokens.push({
            contractAddress: token.assetContract,
            tokenId: token.tokenId,
          });
          break;
        }
        case 2: {
          erc1155Tokens.push({
            contractAddress: token.assetContract,
            tokenId: token.tokenId,
            tokenAmount: token.totalAmount.toString(),
          });
          break;
        }
      }
    }
    return {
      erc20Tokens,
      erc721Tokens,
      erc1155Tokens,
    };
  }

  public async unwrap(
    wrappedTokenId: BigNumberish,
    recipientAddress?: string,
  ): Promise<TransactionResult> {
    const recipient = recipientAddress
      ? recipientAddress
      : await this.contractWrapper.getSignerAddress();
    const receipt = await this.contractWrapper.sendTransaction("unwrap", [
      wrappedTokenId,
      recipient,
    ]);
    return {
      receipt,
    };
  }
}
