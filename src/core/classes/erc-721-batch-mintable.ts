import { ContractWrapper } from "./contract-wrapper";
import { ERC721, ERC721Metadata, IMintableERC721, Multicall } from "contracts";
import { NFTMetadataOrUri, NFTMetadataOwner } from "../../schema";
import { TransactionResultWithId } from "../types";
import { uploadOrExtractURIs } from "../../common/nft";
import { IStorage } from "../interfaces";
import { Erc721 } from "./erc-721";
import { TokensMintedEvent } from "contracts/IMintableERC721";

export class Erc721BatchMintable {
  private contractWrapper: ContractWrapper<IMintableERC721 & Multicall>;
  private storage: IStorage;
  private erc721: Erc721<ERC721Metadata & ERC721>;

  constructor(
    erc721: Erc721<ERC721Metadata & ERC721>,
    contractWrapper: ContractWrapper<IMintableERC721 & Multicall>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Mint Many unique NFTs
   *
   * @remarks Mint many unique NFTs at once to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const walletAddress = "{{wallet_address}}";
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
   * const tx = await contract.mintBatchTo(walletAddress, metadatas);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async to(
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
