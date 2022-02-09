import { BigNumber, BigNumberish, ethers } from "ethers";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { DropERC721 } from "@3rdweb/contracts";
import {
  CommonNFTInput,
  NFTMetadata,
  NFTMetadataInput,
} from "../schema/tokens/common";
import {
  IStorage,
  TransactionResultPromise,
  TransactionResultWithId,
} from "../core";
import { fetchTokenMetadata } from "./nft";

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
  ): TransactionResultPromise {
    if (!password) {
      throw new Error("Password is required");
    }
    const key = await this.hashDelayRevealPasword(batchId, password);
    // performing the reveal locally to make sure it'd succeed before sending the transaction
    try {
      const decryptedUri =
        await this.contractWrapper.readContract.callStatic.reveal(batchId, key);
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
   * Gets a list of token uris that needs to be revealed.
   */
  public async getUnrevealList() {
    const count = await this.contractWrapper.readContract.getBaseURICount();
    if (count.isZero()) {
      return [];
    }

    const countRangeArray = Array.from(Array(count.toNumber()).keys());

    // first batch always start from 0. don't need to fetch the last batch so pop it from the range array
    const endTokenIndices = await Promise.all(
      countRangeArray
        .slice(0, countRangeArray.length - 1)
        .map((i) => this.contractWrapper.readContract.baseURIIndices(i)),
    );

    // returns the token uri for each batch. first batch always starts from token id 0.
    const tokenUris = await Promise.all(
      Array.from([0, ...endTokenIndices]).map((i) =>
        this.contractWrapper.readContract.tokenURI(i),
      ),
    );

    const tokenMetadatas = await Promise.all(
      Array.from([0, ...endTokenIndices]).map((tokenId) =>
        this.getNftMetadata(tokenId),
      ),
    );

    // static call to verify and check on the revert messages for revealed status.
    const revealed = await Promise.all(
      countRangeArray.map((i) =>
        this.contractWrapper.readContract.callStatic
          .reveal(i, ethers.utils.toUtf8Bytes(""))
          .catch((err) => {
            if (err.message.includes("nothing to reveal")) {
              return true;
            }
            return false;
          }),
      ),
    );

    return tokenUris
      .map((uri, index) => ({
        id: index,
        uri,
        metadata: tokenMetadatas[index],
        revealed: revealed[index],
      }))
      .filter((b) => !b.revealed);
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
