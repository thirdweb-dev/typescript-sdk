import { ContractWrapper } from "./contract-wrapper";
import { LazyMintERC721 } from "contracts";
import { CommonNFTInput, NFTMetadata, NFTMetadataInput } from "../../schema";
import { TransactionResultWithId } from "../types";
import { IStorage } from "../interfaces";
import { Erc721 } from "./erc-721";
import { Erc721BatchMintable } from "./erc-721-batch-mintable";
import { FEATURE_NFT_LAZY_MINTABLE } from "../../constants/erc721-features";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { UploadProgressEvent } from "../../types";
import { ethers } from "ethers";
import { TokensLazyMintedEvent } from "contracts/LazyMintERC721";

/**
 * LazyMint ERC721 NFTs
 * @remarks NFT lazy minting functionality that handles IPFS batch uploads for you.
 * @example
 * ```javascript
 * const contract = await sdk.getContract("{{contract_address}}");
 * await contract.nft.lazy.mint(walletAddress, nftMetadata);
 * ```
 * @public
 */
export class Erc721LazyMintable implements DetectableFeature {
  featureName = FEATURE_NFT_LAZY_MINTABLE.name;
  private contractWrapper: ContractWrapper<LazyMintERC721>;
  private storage: IStorage;
  private erc721: Erc721;

  public batch: Erc721BatchMintable | undefined;

  constructor(
    erc721: Erc721,
    contractWrapper: ContractWrapper<LazyMintERC721>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Create a batch of unique NFTs to be claimed in the future
   *
   * @remarks Create batch allows you to create a batch of many unique NFTs in one transaction.
   *
   * @example
   * ```javascript
   * // Custom metadata of the NFTs to create
   * const metadatas = [{
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }, {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"),
   * }];
   *
   * const results = await contract.nft.lazy.mint(metadatas); // uploads and creates the NFTs on chain
   * const firstTokenId = results[0].id; // token id of the first created NFT
   * const firstNFT = await results[0].data(); // (optional) fetch details of the first created NFT
   * ```
   *
   * @param metadatas - The metadata to include in the batch.
   * @param options - optional upload progress callback
   */
  public async mint(
    metadatas: NFTMetadataInput[],
    options?: {
      onProgress: (event: UploadProgressEvent) => void;
    },
  ): Promise<TransactionResultWithId<NFTMetadata>[]> {
    const startFileNumber =
      await this.contractWrapper.readContract.nextTokenIdToMint();
    const batch = await this.storage.uploadMetadataBatch(
      metadatas.map((m) => CommonNFTInput.parse(m)),
      startFileNumber.toNumber(),
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
      options,
    );
    const baseUri = batch.baseUri;
    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      batch.uris.length,
      baseUri.endsWith("/") ? baseUri : `${baseUri}/`,
      ethers.utils.toUtf8Bytes(""),
    ]);
    const event = this.contractWrapper.parseLogs<TokensLazyMintedEvent>(
      "TokensLazyMinted",
      receipt?.logs,
    );
    const startingIndex = event[0].args.startTokenId;
    const endingIndex = event[0].args.endTokenId;
    const results = [];
    for (let id = startingIndex; id.lte(endingIndex); id = id.add(1)) {
      results.push({
        id,
        receipt,
        data: () => this.erc721.getTokenMetadata(id),
      });
    }
    return results;
  }
}
