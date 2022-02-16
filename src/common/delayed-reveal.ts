import { BigNumber, BigNumberish, ethers } from "ethers";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { DropERC721 } from "@thirdweb-dev/contracts";
import {
  CommonNFTInput,
  NFTMetadata,
  NFTMetadataInput,
} from "../schema/tokens/common";
import { IStorage, TransactionResult, TransactionResultWithId } from "../core";
import { fetchTokenMetadata } from "./nft";
import { BatchToReveal } from "../types/delayed-reveal";

export class DelayedReveal<T extends DropERC721> {
  private contractWrapper: ContractWrapper<T>;
  private storage: IStorage;

  constructor(contractWrapper: ContractWrapper<T>, storage: IStorage) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Create a batch of encrypted NFTs that can be revealed at a later time.
   * @param placeholder - the placeholder NFT to show before the reveal
   * @param metadatas - the final NFTs that will be hidden
   * @param password - the password that will be used to reveal these NFTs
   */
  public async createDelayRevealBatch(
    placeholder: NFTMetadataInput,
    metadatas: NFTMetadataInput[],
    password: string,
  ): Promise<TransactionResultWithId[]> {
    if (!password) {
      throw new Error("Password is required");
    }

    const placeholderUri = await this.storage.uploadMetadata(
      CommonNFTInput.parse(placeholder),
      this.contractWrapper.readContract.address,
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

    const events = this.contractWrapper.parseLogs(
      "LazyMintedTokens",
      receipt?.logs,
    );
    const [startingIndex, endingIndex]: BigNumber[] = events[0].args;
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

    // map over to get the base uri indices, which should be the end token id of every batch
    const uriIndices = await Promise.all(
      countRangeArray.map((i) =>
        this.contractWrapper.readContract.baseURIIndices(i),
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
