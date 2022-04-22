import { ContractWrapper } from "./contract-wrapper";
import { ERC721, ERC721Metadata, IMintableERC721 } from "contracts";
import { NFTMetadataOrUri, NFTMetadataOwner } from "../../schema";
import { TransactionResultWithId } from "../types";
import { uploadOrExtractURI, uploadOrExtractURIs } from "../../common/nft";
import { IStorage } from "../interfaces";
import { Erc721 } from "./erc-721";
import { TokensMintedEvent } from "contracts/IMintableERC721";

export class Erc721Mintable<TContract extends IMintableERC721> {
  private contractWrapper: ContractWrapper<TContract>;
  private storage: IStorage;
  private erc721: Erc721<ERC721Metadata & ERC721>;

  constructor(
    erc721: Erc721<ERC721Metadata & ERC721>,
    contractWrapper: ContractWrapper<TContract>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Mint an NFT to the connected wallet
   *
   * @remarks See {@link NFTCollection.mintTo}
   */
  public async toSelf(
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    return this.toAddress(
      await this.contractWrapper.getSignerAddress(),
      metadata,
    );
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
  public async toAddress(
    to: string,
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const uri = await uploadOrExtractURI(metadata, this.storage);
    const receipt = await this.contractWrapper.sendTransaction("mintTo", [
      to,
      uri,
    ]);
    // TODO switch to Transfer event!
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
      data: () => this.erc721.get(id),
    };
  }

  /**
   * Mint Many NFTs to the connected wallet
   *
   * @remarks See {@link NFTCollection.mintBatchTo}
   */
  public async batchToSelf(
    metadatas: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this.batchToAddress(
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
  public async batchToAddress(
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
        data: () => this.erc721.get(id),
      };
    });
  }
}
