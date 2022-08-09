import { TokensLazyMintedEvent } from "contracts/LazyMint";
import { uploadOrExtractURIs } from "../../common/nft";
import { FEATURE_EDITION_DROPABLE } from "../../constants/erc1155-features";
import { NFTMetadata, NFTMetadataOrUri } from "../../schema/tokens/common";
import { BaseDropERC1155 } from "../../types/eips";
import { UploadProgressEvent } from "../../types/events";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { IStorage } from "../interfaces/IStorage";
import { TransactionResultWithId } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { Erc1155 } from "./erc-1155";

export class Erc1155Dropable implements DetectableFeature {
  featureName = FEATURE_EDITION_DROPABLE.name;

  private contractWrapper: ContractWrapper<BaseDropERC1155>;
  private erc1155: Erc1155;
  private storage: IStorage;

  constructor(
    erc1155: Erc1155,
    contractWrapper: ContractWrapper<BaseDropERC1155>,
    storage: IStorage,
  ) {
    this.erc1155 = erc1155;
    this.contractWrapper = contractWrapper;

    this.storage = storage;
  }

  /**
   * Create a batch of NFTs to be claimed in the future
   *
   * @remarks Create batch allows you to create a batch of many NFTs in one transaction.
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
   * const results = await contract.createBatch(metadatas); // uploads and creates the NFTs on chain
   * const firstTokenId = results[0].id; // token id of the first created NFT
   * const firstNFT = await results[0].data(); // (optional) fetch details of the first created NFT
   * ```
   *
   * @param metadatas - The metadata to include in the batch.
   * @param options - optional upload progress callback
   */
  public async createBatch(
    metadatas: NFTMetadataOrUri[],
    options?: {
      onProgress: (event: UploadProgressEvent) => void;
    },
  ): Promise<TransactionResultWithId<NFTMetadata>[]> {
    const startFileNumber = await this.erc1155.nextTokenIdToMint();
    const batch = await uploadOrExtractURIs(
      metadatas,
      this.storage,
      startFileNumber.toNumber(),
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
      options,
    );
    // ensure baseUri is the same for the entire batch
    const baseUri = batch[0].substring(0, batch[0].lastIndexOf("/"));
    for (let i = 0; i < batch.length; i++) {
      const uri = batch[i].substring(0, batch[i].lastIndexOf("/"));
      if (baseUri !== uri) {
        throw new Error(
          `Can only create batches with the same base URI for every entry in the batch. Expected '${baseUri}' but got '${uri}'`,
        );
      }
    }
    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      batch.length,
      `${baseUri.endsWith("/") ? baseUri : `${baseUri}/`}`,
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
        data: () => this.erc1155.getTokenMetadata(id),
      });
    }
    return results;
  }
}
