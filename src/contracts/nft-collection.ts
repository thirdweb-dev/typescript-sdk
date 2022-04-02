import { NFTMetadataOrUri, NFTMetadataOwner } from "../schema/tokens/common";
import type {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResultWithId,
} from "../core";
import { TokenErc721ContractSchema } from "../schema/contracts/token-erc721";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { TokenERC721, TokenERC721__factory } from "@thirdweb-dev/contracts";
import { SDKOptions } from "../schema/sdk-options";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { Erc721 } from "../core/classes/erc-721";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { Erc721SignatureMinting } from "../core/classes/erc-721-signature-minting";
import { GasCostEstimator, ContractInterceptor } from "../core/classes";
import { TokensMintedEvent } from "@thirdweb-dev/contracts/dist/TokenERC721";
import { uploadOrExtractURI, uploadOrExtractURIs } from "../common/nft";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";

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
  static contractFactory = TokenERC721__factory;
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

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC721>(
      network,
      address,
      NFTCollection.contractFactory.abi,
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
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Mint an NFT to the connected wallet
   *
   * @remarks See {@link NFTCollection.mintTo}
   */
  public async mint(
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    return this.mintTo(await this.contractWrapper.getSignerAddress(), metadata);
  }

  /**
   * Mint a unique NFT
   *
   * @remarks Mint a unique NFT to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const tx = await contract.mintTo(toAddress, metadata);
   * const receipt = tx.receipt; // the transaction receipt
   * const tokenId = tx.id; // the id of the NFT minted
   * const nft = await tx.data(); // (optional) fetch details of minted NFT
   * ```
   */
  public async mintTo(
    to: string,
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const uri = await uploadOrExtractURI(metadata, this.storage);
    const receipt = await this.contractWrapper.sendTransaction("mintTo", [
      to,
      uri,
    ]);
    const event = this.contractWrapper.parseLogs<TokensMintedEvent>(
      "TokensMinted",
      receipt?.logs,
    );
    if (event.length === 0) {
      throw new Error("TokenMinted event not found");
    }
    const id = event[0].args.tokenIdMinted;
    return {
      id,
      receipt,
      data: () => this.get(id.toString()),
    };
  }

  /**
   * Mint Many NFTs to the connected wallet
   *
   * @remarks See {@link NFTCollection.mintBatchTo}
   */
  public async mintBatch(
    metadatas: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this.mintBatchTo(
      await this.contractWrapper.getSignerAddress(),
      metadatas,
    );
  }

  /**
   * Mint Many unique NFTs
   *
   * @remarks Mint many unique NFTs at once to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFTs you want to mint.
   * const metadatas = [{
   *   name: "Cool NFT #1",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }, {
   *   name: "Cool NFT #2",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/other/image.png"),
   * }];
   *
   * const tx = await contract.mintBatchTo(toAddress, metadatas);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async mintBatchTo(
    to: string,
    metadatas: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    const uris = await uploadOrExtractURIs(metadatas, this.storage);
    const encoded = uris.map((uri) =>
      this.contractWrapper.readContract.interface.encodeFunctionData("mintTo", [
        to,
        uri,
      ]),
    );
    const receipt = await this.contractWrapper.multiCall(encoded);
    const events = this.contractWrapper.parseLogs<TokensMintedEvent>(
      "TokensMinted",
      receipt.logs,
    );
    if (events.length === 0 || events.length < metadatas.length) {
      throw new Error("TokenMinted event not found, minting failed");
    }
    return events.map((e) => {
      const id = e.args.tokenIdMinted;
      return {
        id,
        receipt,
        data: () => this.get(id),
      };
    });
  }
}
