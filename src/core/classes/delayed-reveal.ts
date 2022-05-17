import { BigNumber, BigNumberish, ethers } from "ethers";
import { ContractWrapper } from "./contract-wrapper";
import { DropERC721, SignatureDrop } from "contracts";
import {
  CommonNFTInput,
  NFTMetadata,
  NFTMetadataInput,
} from "../../schema/tokens/common";
import { IStorage, TransactionResult, TransactionResultWithId } from "../index";
import { fetchTokenMetadata } from "../../common/nft";
import { BatchToReveal } from "../../types/delayed-reveal";
import { TokensLazyMintedEvent } from "contracts/DropERC721";

/**
 * Handles delayed reveal logic
 * @public
 */
export class DelayedReveal<T extends SignatureDrop | DropERC721> {
  private contractWrapper: ContractWrapper<T>;
  private storage: IStorage;

  constructor(contractWrapper: ContractWrapper<T>, storage: IStorage) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Create a batch of encrypted NFTs that can be revealed at a later time.
   * @example
   * ```javascript
   * // the real NFTs, these will be encrypted until your reveal them!
   * const realNFTs = [{
   *   name: "Common NFT #1",
   *   description: "Common NFT, one of many.",
   *   image: fs.readFileSync("path/to/image.png"),
   * }, {
   *   name: "Super Rare NFT #2",
   *   description: "You got a Super Rare NFT!",
   *   image: fs.readFileSync("path/to/image.png"),
   * }];
   * // A placeholder NFT that people will get immediately in their wallet, until the reveal happens!
   * const placeholderNFT = {
   *   name: "Hidden NFT",
   *   description: "Will be revealed next week!"
   * };
   * // Create and encrypt the NFTs
   * await contract.revealer.createDelayedRevealBatch(
   *   placeholderNFT,
   *   realNFTs,
   *   "my secret password",
   * );
   * // Whenever you're ready, reveal your NFTs at any time!
   * const batchId = 0; // the batch to reveal
   * await contract.revealer.reveal(batchId, "my secret password");
   * ```
   * @param placeholder - the placeholder NFT to show before the reveal
   * @param metadatas - the final NFTs that will be hidden
   * @param password - the password that will be used to reveal these NFTs
   */
  public async createDelayedRevealBatch(
    placeholder: NFTMetadataInput,
    metadatas: NFTMetadataInput[],
    password: string,
  ): Promise<TransactionResultWithId[]> {
    if (!password) {
      throw new Error("Password is required");
    }

    const { baseUri: placeholderUri } = await this.storage.uploadMetadataBatch(
      [CommonNFTInput.parse(placeholder)],
      0,
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
    );

    const startFileNumber =
      await this.contractWrapper.readContract.nextTokenIdToMint();

    const batch = await this.storage.uploadMetadataBatch(
      metadatas.map((m) => CommonNFTInput.parse(m)),
      startFileNumber.toNumber(),
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
    );

    const baseUri = batch.baseUri;
    const baseUriId = await this.contractWrapper.readContract.getBaseURICount();
    const encryptedBaseUri =
      await this.contractWrapper.readContract.encryptDecrypt(
        ethers.utils.toUtf8Bytes(
          baseUri.endsWith("/") ? baseUri : `${baseUri}/`,
        ),
        await this.hashDelayRevealPasword(baseUriId, password),
      );

    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      batch.metadataUris.length,
      placeholderUri.endsWith("/") ? placeholderUri : `${placeholderUri}/`,
      encryptedBaseUri,
    ]);

    const events = this.contractWrapper.parseLogs<TokensLazyMintedEvent>(
      "TokensLazyMinted",
      receipt?.logs,
    );
    const startingIndex = events[0].args.startTokenId;
    const endingIndex = events[0].args.endTokenId;
    const results = [];
    for (let id = startingIndex; id.lte(endingIndex); id = id.add(1)) {
      results.push({
        id,
        receipt,
      });
    }
    return results;
  }

  /**
   * Reveal a batch of hidden NFTs
   * @param batchId - the id of the batch to reveal
   * @param password - the password
   */
  public async reveal(
    batchId: BigNumberish,
    password: string,
  ): Promise<TransactionResult> {
    if (!password) {
      throw new Error("Password is required");
    }
    const key = await this.hashDelayRevealPasword(batchId, password);
    // performing the reveal locally to make sure it'd succeed before sending the transaction
    try {
      const decryptedUri = await this.contractWrapper
        .callStatic()
        .reveal(batchId, key);
      // basic sanity check for making sure decryptedUri is valid
      // this is optional because invalid decryption key would result in non-utf8 bytes and
      // ethers would throw when trying to decode it
      if (!decryptedUri.includes("://") || !decryptedUri.endsWith("/")) {
        throw new Error("invalid password");
      }
    } catch (e) {
      throw new Error("invalid password");
    }

    return {
      receipt: await this.contractWrapper.sendTransaction("reveal", [
        batchId,
        key,
      ]),
    };
  }

  /**
   * Gets the list of unrevealed NFT batches.
   */
  public async getBatchesToReveal(): Promise<BatchToReveal[]> {
    const count = await this.contractWrapper.readContract.getBaseURICount();
    if (count.isZero()) {
      return [];
    }

    const countRangeArray = Array.from(Array(count.toNumber()).keys());

    const contractType = await this.contractWrapper.readContract.contractType();

    function fetchMethod(i) {
      if(contractType == "SignatureDrop"){
        `this.contractWrapper.readContract.getBatchIdatIndex(${i})`;
      } else {
        `this.contractWrapper.readContract.baseURIIndices(${i})`;
      }
    }

    // map over to get the base uri indices, which should be the end token id of every batch
    const uriIndices = await Promise.all(
      countRangeArray.map((i) =>
          eval( fetchMethod(i) )
        ),
    );

    // first batch always start from 0. don't need to fetch the last batch so pop it from the range array
    const uriIndicesWithZeroStart = uriIndices.slice(0, uriIndices.length - 1);

    // returns the token uri for each batches. first batch always starts from token id 0.
    const tokenUris = await Promise.all(
      Array.from([0, ...uriIndicesWithZeroStart]).map((i) =>
        this.contractWrapper.readContract.tokenURI(i),
      ),
    );

    const tokenMetadatas = await Promise.all(
      Array.from([0, ...uriIndicesWithZeroStart]).map((i) =>
        this.getNftMetadata(i.toString()),
      ),
    );

    // index is the uri indicies, which is end token id. different from uris
    const encryptedBaseUris = await Promise.all(
      Array.from([...uriIndices]).map((i) =>
        this.contractWrapper.readContract.encryptedBaseURI(i),
      ),
    );

    return tokenUris
      .map((uri, index) => ({
        batchId: BigNumber.from(index),
        batchUri: uri,
        placeholderMetadata: tokenMetadatas[index],
      }))
      .filter(
        (_, index) => ethers.utils.hexDataLength(encryptedBaseUris[index]) > 0,
      );
  }

  /**
   * Algorithm to hash delay reveal password, so we don't broadcast the input password on-chain.
   *
   * @internal
   */
  private async hashDelayRevealPasword(
    batchTokenIndex: BigNumberish,
    password: string,
  ) {
    const chainId = await this.contractWrapper.getChainID();
    const contractAddress = this.contractWrapper.readContract.address;
    return ethers.utils.solidityKeccak256(
      ["string", "uint256", "uint256", "address"],
      [password, chainId, batchTokenIndex, contractAddress],
    );
  }

  private async getNftMetadata(tokenId: BigNumberish): Promise<NFTMetadata> {
    const tokenUri = await this.contractWrapper.readContract.tokenURI(tokenId);
    return fetchTokenMetadata(tokenId, tokenUri, this.storage);
  }
}
