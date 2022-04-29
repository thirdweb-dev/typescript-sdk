import { ContractWrapper } from "./contract-wrapper";
import { ERC721, ERC721Metadata, IMintableERC721, Multicall } from "contracts";
import { NFTMetadataOrUri, NFTMetadataOwner } from "../../schema";
import { TransactionResultWithId } from "../types";
import { uploadOrExtractURI } from "../../common/nft";
import { IStorage } from "../interfaces";
import { Erc721 } from "./erc-721";
import { TokensMintedEvent } from "contracts/IMintableERC721";
import { Erc721BatchMintable } from "./erc-721-batch-mintable";
import { detectContractFeature } from "../../common";

export class Erc721Mintable {
  private contractWrapper: ContractWrapper<IMintableERC721>;
  private storage: IStorage;
  private erc721: Erc721<ERC721Metadata & ERC721>;

  public batch: Erc721BatchMintable | undefined;

  constructor(
    erc721: Erc721<ERC721Metadata & ERC721>,
    contractWrapper: ContractWrapper<IMintableERC721>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
    this.storage = storage;
    this.batch = this.detectErc721BatchMintable();
  }

  /**
   * Mint a unique NFT
   *
   * @remarks Mint a unique NFT to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const walletAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const tx = await contract.mintTo(walletAddress, metadata);
   * const receipt = tx.receipt; // the transaction receipt
   * const tokenId = tx.id; // the id of the NFT minted
   * const nft = await tx.data(); // (optional) fetch details of minted NFT
   * ```
   */
  public async to(
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

  private detectErc721BatchMintable(): Erc721BatchMintable | undefined {
    if (
      detectContractFeature<IMintableERC721 & Multicall>(
        this.contractWrapper,
        "ERC721BatchMintable",
      )
    ) {
      return new Erc721BatchMintable(
        this.erc721,
        this.contractWrapper,
        this.storage,
      );
    }
    return undefined;
  }
}
