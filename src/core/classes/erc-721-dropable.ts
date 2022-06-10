import { TokensClaimedEvent } from "contracts/Drop";
import { BigNumber, BigNumberish, BytesLike, ethers, utils } from "ethers";
import { FEATURE_NFT_DROPABLE } from "../../constants/erc721-features";
import {
  CommonNFTInput,
  NFTMetadata,
  NFTMetadataInput,
  NFTMetadataOwner,
} from "../../schema";
import { TokensLazyMintedEvent } from "contracts/LazyMintERC721";
import { ClaimVerification, UploadProgressEvent } from "../../types";
import { BaseDelayedRevealERC721, BaseDropERC721 } from "../../types/eips";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { IStorage } from "../interfaces/IStorage";
import { TransactionResultWithId } from "../types";
import { ContractMetadata } from "./contract-metadata";
import { ContractWrapper } from "./contract-wrapper";
import { DropClaimConditions } from "./drop-claim-conditions";
import { Erc721 } from "./erc-721";
import { DelayedReveal } from "./delayed-reveal";
import { detectContractFeature } from "../../common/feature-detection";
import { CustomContractSchema } from "../../schema/contracts/custom";

/**
 * Lazily mint and claim ERC721 NFTs
 * @remarks Manage claim phases and claim ERC721 NFTs that have been lazily minted.
 * @example
 * ```javascript
 * const contract = await sdk.getContract("{{contract_address}}");
 * await contract.drop.claim(quantity);
 * ```
 */
export class Erc721Dropable implements DetectableFeature {
  featureName = FEATURE_NFT_DROPABLE.name;

  public revealer: DelayedReveal<BaseDelayedRevealERC721> | undefined;

  /**
   * Configure claim conditions
   * @remarks Define who can claim NFTs in the collection, when and how many.
   * @example
   * ```javascript
   * const presaleStartTime = new Date();
   * const publicSaleStartTime = new Date(Date.now() + 60 * 60 * 24 * 1000);
   * const claimConditions = [
   *   {
   *     startTime: presaleStartTime, // start the presale now
   *     maxQuantity: 2, // limit how many mints for this presale
   *     price: 0.01, // presale price
   *     snapshot: ['0x...', '0x...'], // limit minting to only certain addresses
   *   },
   *   {
   *     startTime: publicSaleStartTime, // 24h after presale, start public sale
   *     price: 0.08, // public sale price
   *   }
   * ]);
   * await contract.claimConditions.set(claimConditions);
   * ```
   */
  public claimConditions: DropClaimConditions<BaseDropERC721> | undefined;
  // TODO: Make claim conditions optional optional after contract interface changes

  private contractWrapper: ContractWrapper<BaseDropERC721>;
  private erc721: Erc721;
  private storage: IStorage;

  constructor(
    erc721: Erc721,
    contractWrapper: ContractWrapper<BaseDropERC721>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;

    this.storage = storage;
    this.revealer = this.detectErc721Revealable();
    this.claimConditions = this.detectClaimConditions();
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
  public async lazyMint(
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

  /**
   * Claim unique NFTs to a specific Wallet
   *
   * @remarks Let the specified wallet claim NFTs.
   *
   * @example
   * ```javascript
   * const address = "{{wallet_address}}"; // address of the wallet you want to claim the NFTs
   * const quantity = 1; // how many unique NFTs you want to claim
   *
   * const tx = await contract.claimTo(address, quantity);
   * const receipt = tx.receipt; // the transaction receipt
   * const claimedTokenId = tx.id; // the id of the NFT claimed
   * const claimedNFT = await tx.data(); // (optional) get the claimed NFT metadata
   * ```
   *
   * @param destinationAddress - Address you want to send the token to
   * @param quantity - Quantity of the tokens you want to claim
   * @param claimData - Optional claim verification data (e.g. price, allowlist proof, etc...)
   * @param proofs - Optional Array of proofs
   * @returns - an array of results containing the id of the token claimed, the transaction receipt and a promise to optionally fetch the nft metadata
   */
  public async claimTo(
    destinationAddress: string,
    quantity: BigNumberish,
    claimData?: ClaimVerification,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    let claimVerification = claimData;
    if (this.claimConditions && !claimData) {
      claimVerification = await this.claimConditions.prepareClaim(
        quantity,
        proofs,
      );
    }

    if (!claimVerification) {
      throw new Error(
        "Claim verification Data is required - either pass it in as 'claimData' or set claim conditions via 'setClaimConditions'",
      );
    }

    const receipt = await this.contractWrapper.sendTransaction(
      "claim",
      [
        destinationAddress,
        quantity,
        claimVerification.currencyAddress,
        claimVerification.price,
        claimVerification.proofs,
        claimVerification.maxQuantityPerTransaction,
      ],
      claimVerification.overrides,
    );
    const event = this.contractWrapper.parseLogs<TokensClaimedEvent>(
      "TokensClaimed",
      receipt?.logs,
    );
    const startingIndex: BigNumber = event[0].args.startTokenId;
    const endingIndex = startingIndex.add(quantity);
    const results = [];
    for (let id = startingIndex; id.lt(endingIndex); id = id.add(1)) {
      results.push({
        id,
        receipt,
        data: () => this.erc721.get(id),
      });
    }
    return results;
  }

  /**
   * Claim NFTs to the connected wallet.
   *
   * @remarks See {@link NFTDrop.claimTo}
   *
   * @returns - an array of results containing the id of the token claimed, the transaction receipt and a promise to optionally fetch the nft metadata
   */
  public async claim(
    quantity: BigNumberish,
    claimData?: ClaimVerification,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this.claimTo(
      await this.contractWrapper.getSignerAddress(),
      quantity,
      claimData,
      proofs,
    );
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  private detectErc721Revealable():
    | DelayedReveal<BaseDelayedRevealERC721>
    | undefined {
    if (
      detectContractFeature<BaseDelayedRevealERC721>(
        this.contractWrapper,
        "ERC721Revealable",
      )
    ) {
      return new DelayedReveal(this.contractWrapper, this.storage);
    }
    return undefined;
  }

  private detectClaimConditions():
    | DropClaimConditions<BaseDropERC721>
    | undefined {
    if (
      detectContractFeature<BaseDropERC721>(
        this.contractWrapper,
        "ERC721ClaimConditions",
      )
    ) {
      const metadata = new ContractMetadata(
        this.contractWrapper,
        CustomContractSchema,
        this.storage,
      );
      return new DropClaimConditions(
        this.contractWrapper,
        metadata,
        this.storage,
      );
    }
    return undefined;
  }
}
