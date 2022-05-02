import type {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import { TokenErc721ContractSchema } from "../schema/contracts/token-erc721";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { TokenERC721 } from "contracts";
import { SDKOptions } from "../schema/sdk-options";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { Erc721 } from "../core/classes/erc-721";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { Erc721SignatureMinting } from "../core/classes/erc-721-signature-minting";
import { ContractInterceptor, GasCostEstimator } from "../core/classes";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";
import { getRoleHash } from "../common";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish } from "ethers";
import { NFTMetadataOrUri, NFTMetadataOwner } from "../schema";
import { QueryAllParams } from "../types";

/**
 * Create a collection of one-of-one NFTs.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getNFTCollection("{{contract_address}}");
 * ```
 *
 * @public
 */
export class NFTCollection extends Erc721<TokenERC721> {
  static contractType = "nft-collection" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractAbi = require("../../abis/TokenERC721.json");
  /**
   * @internal
   */
  static schema = TokenErc721ContractSchema;

  public metadata: ContractMetadata<TokenERC721, typeof NFTCollection.schema>;
  public roles: ContractRoles<
    TokenERC721,
    typeof NFTCollection.contractRoles[number]
  >;
  public encoder: ContractEncoder<TokenERC721>;
  public estimator: GasCostEstimator<TokenERC721>;
  public events: ContractEvents<TokenERC721>;
  public primarySale: ContractPrimarySale<TokenERC721>;
  public platformFee: ContractPlatformFee<TokenERC721>;
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
  public royalty: ContractRoyalty<TokenERC721, typeof NFTCollection.schema>;
  /**
   * Signature Minting
   * @remarks Generate dynamic NFTs with your own signature, and let others mint them using that signature.
   * @example
   * ```javascript
   * // see how to craft a payload to sign in the `contract.signature.generate()` documentation
   * const signedPayload = contract.signature.generate(payload);
   *
   * // now anyone can mint the NFT
   * const tx = contract.signature.mint(signedPayload);
   * const receipt = tx.receipt; // the mint transaction receipt
   * const mintedId = tx.id; // the id of the NFT minted
   * ```
   */
  public signature: Erc721SignatureMinting;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<TokenERC721>;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private _mint = this.mint!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private _batchMint = this.mint!.batch!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private _query = this.query!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private _owned = this.query!.owned!;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC721>(
      network,
      address,
      NFTCollection.contractAbi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      NFTCollection.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      NFTCollection.contractRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySale = new ContractPrimarySale(this.contractWrapper);
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.signature = new Erc721SignatureMinting(
      this.contractWrapper,
      this.roles,
      this.storage,
    );
    this.events = new ContractEvents(this.contractWrapper);
    this.platformFee = new ContractPlatformFee(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * {@inheritDoc Erc721Enumerable.all}
   */
  public async getAll(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    return this._query.all(queryParams);
  }
  /**
   * {@inheritDoc Erc721Owned.all}
   */
  public async getOwned(walletAddress?: string): Promise<NFTMetadataOwner[]> {
    return this._owned.all(walletAddress);
  }

  /**
   * {@inheritDoc Erc721Owned.tokendIds}
   */
  public async getOwnedTokenIds(walletAddress?: string): Promise<BigNumber[]> {
    return this._owned.tokenIds(walletAddress);
  }

  /**
   * {@inheritDoc Erc721Enumerable.totalSupply}
   */
  public async totalSupply() {
    return this._query.totalSupply();
  }

  /**
   * Get whether users can transfer NFTs from this contract
   */
  public async isTransferRestricted(): Promise<boolean> {
    const anyoneCanTransfer = await this.contractWrapper.readContract.hasRole(
      getRoleHash("transfer"),
      AddressZero,
    );
    return !anyoneCanTransfer;
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * {@inheritDoc Erc721Mintable.to}
   */
  public async mintToSelf(
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const signerAddress = await this.contractWrapper.getSignerAddress();
    return this._mint.to(signerAddress, metadata);
  }

  /**
   * {@inheritDoc Erc721Mintable.to}
   */
  public async mintTo(
    walletAddress: string,
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    return this._mint.to(walletAddress, metadata);
  }
  /**
   * {@inheritDoc Erc721BatchMintable.to}
   */
  public async mintBatch(
    metadata: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    const signerAddress = await this.contractWrapper.getSignerAddress();
    return this._batchMint.to(signerAddress, metadata);
  }
  /**
   * {@inheritDoc Erc721BatchMintable.to}
   */
  public async mintBatchTo(
    walletAddress: string,
    metadata: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this._batchMint.to(walletAddress, metadata);
  }

  /**
   * Burn a single NFT
   * @param tokenId - the token Id to burn
   */
  public async burn(tokenId: BigNumberish): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [tokenId]),
    };
  }
}
