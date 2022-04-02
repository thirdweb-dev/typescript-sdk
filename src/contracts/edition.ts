import { Erc1155 } from "../core/classes/erc-1155";
import { TokenERC1155, TokenERC1155__factory } from "@thirdweb-dev/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import {
  ContractInterceptor,
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResultWithId,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { TokenErc1155ContractSchema } from "../schema/contracts/token-erc1155";
import {
  EditionMetadata,
  EditionMetadataOrUri,
} from "../schema/tokens/edition";
import { TokensMintedEvent } from "@thirdweb-dev/contracts/dist/TokenERC1155";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { Erc1155SignatureMinting } from "../core/classes/erc-1155-signature-minting";
import { GasCostEstimator } from "../core/classes/gas-cost-estimator";
import { uploadOrExtractURI, uploadOrExtractURIs } from "../common/nft";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";

/**
 * Create a collection of NFTs that lets you mint multiple copies of each NFT.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getEdition("{{contract_address}}");
 * ```
 *
 * @public
 */
export class Edition extends Erc1155<TokenERC1155> {
  static contractType = "edition" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = TokenERC1155__factory;
  /**
   * @internal
   */
  static schema = TokenErc1155ContractSchema;

  public metadata: ContractMetadata<TokenERC1155, typeof Edition.schema>;
  public roles: ContractRoles<
    TokenERC1155,
    typeof Edition.contractRoles[number]
  >;
  public primarySale: ContractPrimarySale<TokenERC1155>;
  public platformFee: ContractPlatformFee<TokenERC1155>;
  public encoder: ContractEncoder<TokenERC1155>;
  public estimator: GasCostEstimator<TokenERC1155>;
  public events: ContractEvents<TokenERC1155>;
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
  public royalty: ContractRoyalty<TokenERC1155, typeof Edition.schema>;
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
  public signature: Erc1155SignatureMinting;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<TokenERC1155>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC1155>(
      network,
      address,
      Edition.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      Edition.schema,
      this.storage,
    );
    this.roles = new ContractRoles(this.contractWrapper, Edition.contractRoles);
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySale = new ContractPrimarySale(this.contractWrapper);
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.platformFee = new ContractPlatformFee(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
    this.signature = new Erc1155SignatureMinting(
      this.contractWrapper,
      this.roles,
      this.storage,
    );
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Mint NFT for the connected wallet
   *
   * @remarks See {@link Edition.mintTo}
   */
  public async mint(
    metadataWithSupply: EditionMetadataOrUri,
  ): Promise<TransactionResultWithId<EditionMetadata>> {
    return this.mintTo(
      await this.contractWrapper.getSignerAddress(),
      metadataWithSupply,
    );
  }

  /**
   * Mint an NFT with a limited supply
   *
   * @remarks Mint an NFT with a limited supply to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}"
   *
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }
   *
   * const metadataWithSupply = {
   *   metadata,
   *   supply: 1000, // The number of this NFT you want to mint
   * }
   *
   * const tx = await contract.mintTo(toAddress, metadataWithSupply);
   * const receipt = tx.receipt; // the transaction receipt
   * const tokenId = tx.id; // the id of the NFT minted
   * const nft = await tx.data(); // (optional) fetch details of minted NFT
   * ```
   */
  public async mintTo(
    to: string,
    metadataWithSupply: EditionMetadataOrUri,
  ): Promise<TransactionResultWithId<EditionMetadata>> {
    const uri = await uploadOrExtractURI(
      metadataWithSupply.metadata,
      this.storage,
    );
    const receipt = await this.contractWrapper.sendTransaction("mintTo", [
      to,
      ethers.constants.MaxUint256,
      uri,
      metadataWithSupply.supply,
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
   * Increase the supply of an existing NFT and mint it to the connected wallet
   *
   * @param tokenId - the token id of the NFT to increase supply of
   * @param additionalSupply - the additional amount to mint
   */
  public async mintAdditionalSupply(
    tokenId: BigNumberish,
    additionalSupply: BigNumberish,
  ): Promise<TransactionResultWithId<EditionMetadata>> {
    return this.mintAdditionalSupplyTo(
      await this.contractWrapper.getSignerAddress(),
      tokenId,
      additionalSupply,
    );
  }

  /**
   * Increase the supply of an existing NFT and mint it to a given wallet address
   *
   * @param to - the address to mint to
   * @param tokenId - the token id of the NFT to increase supply of
   * @param additionalSupply - the additional amount to mint
   */
  public async mintAdditionalSupplyTo(
    to: string,
    tokenId: BigNumberish,
    additionalSupply: BigNumberish,
  ): Promise<TransactionResultWithId<EditionMetadata>> {
    const metadata = await this.getTokenMetadata(tokenId);
    const receipt = await this.contractWrapper.sendTransaction("mintTo", [
      to,
      tokenId,
      metadata.uri,
      additionalSupply,
    ]);
    return {
      id: BigNumber.from(tokenId),
      receipt,
      data: () => this.get(tokenId),
    };
  }

  /**
   * Mint Many NFTs for the connected wallet
   *
   * @remarks See {@link Edition.mintBatchTo}
   */
  public async mintBatch(
    metadatas: EditionMetadataOrUri[],
  ): Promise<TransactionResultWithId<EditionMetadata>[]> {
    return this.mintBatchTo(
      await this.contractWrapper.getSignerAddress(),
      metadatas,
    );
  }

  /**
   * Mint Many NFTs with limited supplies
   *
   * @remarks Mint many different NFTs with limited supplies to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}"
   *
   * // Custom metadata and supplies of your NFTs
   * const metadataWithSupply = [{
   *   supply: 50, // The number of this NFT you want to mint
   *   metadata: {
   *     name: "Cool NFT #1",
   *     description: "This is a cool NFT",
   *     image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   *   },
   * }, {
   *   supply: 100,
   *   metadata: {
   *     name: "Cool NFT #2",
   *     description: "This is a cool NFT",
   *     image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   *   },
   * }];
   *
   * const tx = await contract.mintBatchTo(toAddress, metadataWithSupply);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async mintBatchTo(
    to: string,
    metadataWithSupply: EditionMetadataOrUri[],
  ): Promise<TransactionResultWithId<EditionMetadata>[]> {
    const metadatas = metadataWithSupply.map((a) => a.metadata);
    const supplies = metadataWithSupply.map((a) => a.supply);
    const uris = await uploadOrExtractURIs(metadatas, this.storage);
    const encoded = uris.map((uri, index) =>
      this.contractWrapper.readContract.interface.encodeFunctionData("mintTo", [
        to,
        ethers.constants.MaxUint256,
        uri,
        supplies[index],
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
