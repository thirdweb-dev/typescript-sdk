import { Erc1155 } from "../core/classes/erc-1155";
import { TokenERC1155, TokenERC1155__factory } from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResultWithId,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { TokenErc1155ModuleSchema } from "../schema/modules/token-erc1155";
import { BundleMetadata, BundleMetadataInput } from "../schema/tokens/bundle";
import { TokenMintedEvent } from "@3rdweb/contracts/dist/TokenERC721";

export class TokenErc1155Module extends Erc1155<TokenERC1155> {
  static moduleType = "TokenERC1155" as const;
  static schema = TokenErc1155ModuleSchema;
  static moduleRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = TokenERC1155__factory;

  public metadata: ContractMetadata<
    TokenERC1155,
    typeof TokenErc1155Module.schema
  >;
  public roles: ContractRoles<
    TokenERC1155,
    typeof TokenErc1155Module.moduleRoles[number]
  >;
  public royalty: ContractRoyalty<
    TokenERC1155,
    typeof TokenErc1155Module.schema
  >;
  public primarySales: ContractPrimarySale<TokenERC1155>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC1155>(
      network,
      address,
      TokenErc1155Module.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      TokenErc1155Module.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      TokenErc1155Module.moduleRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySales = new ContractPrimarySale(this.contractWrapper);
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Mint NFT
   *
   * @remarks Mint an NFT with a specified supply.
   *
   * @example
   * ```javascript
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }
   *
   * const metadataWithSupply = {
   *   metadata,
   *   supply: 1, // The number of this NFT you want to mint
   * }
   *
   * await module.mint(metadataWithSupply);
   * ```
   */
  public async mint(
    metadataWithSupply: BundleMetadataInput,
  ): Promise<TransactionResultWithId<BundleMetadata>> {
    return this.mintTo(
      await this.contractWrapper.getSignerAddress(),
      metadataWithSupply,
    );
  }

  /**
   * Mint NFT
   *
   * @remarks Mint an NFT with a specified supply to a specified wallet.
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
   * await module.mintTo(toAddress, metadataWithSupply);
   * ```
   */
  public async mintTo(
    to: string,
    metadataWithSupply: BundleMetadataInput,
  ): Promise<TransactionResultWithId<BundleMetadata>> {
    const uri = await this.storage.uploadMetadata(metadataWithSupply.metadata);
    const receipt = await this.contractWrapper.sendTransaction("mintTo", [
      to,
      uri,
      metadataWithSupply.supply,
    ]);
    const event = this.contractWrapper.parseLogs<TokenMintedEvent>(
      "TokenMinted",
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
   * Mint Many NFTs
   *
   * @remarks Mint many NFTs with specified supplies at once to the connected wallet
   *
   * @example
   * ```javascript
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
   * await module.mintBatch(metadataWithSupply);
   * ```
   */
  public async mintBatch(
    metadatas: BundleMetadataInput[],
  ): Promise<TransactionResultWithId<BundleMetadata>[]> {
    return this.mintBatchTo(
      await this.contractWrapper.getSignerAddress(),
      metadatas,
    );
  }

  /**
   * Mint Many NFTs
   *
   * @remarks Mint many different NFTs with specified supplies to a specified wallet.
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
   * await module.mintBatchTo(toAddress, metadataWithSupply);
   * ```
   */
  public async mintBatchTo(
    to: string,
    metadataWithSupply: BundleMetadataInput[],
  ): Promise<TransactionResultWithId<BundleMetadata>[]> {
    const metadatas = metadataWithSupply.map((a) => a.metadata);
    const supplies = metadataWithSupply.map((a) => a.supply);
    const { metadataUris: uris } = await this.storage.uploadMetadataBatch(
      metadatas,
    );
    const encoded = uris.map((uri, index) =>
      this.contractWrapper.readContract.interface.encodeFunctionData("mintTo", [
        to,
        uri,
        supplies[index],
      ]),
    );
    const receipt = await this.contractWrapper.multiCall(encoded);
    const events = this.contractWrapper.parseLogs<TokenMintedEvent>(
      "TokenMinted",
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
