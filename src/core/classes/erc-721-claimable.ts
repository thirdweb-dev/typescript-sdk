import { Drop, TokensClaimedEvent } from "contracts/Drop";
import { BigNumber, BigNumberish, BytesLike, utils } from "ethers";
import { prepareClaim } from "../../common/claim-conditions";
import { FEATURE_NFT_CLAIMABLE } from "../../constants/erc721-features";
import { SmartContract } from "../../contracts";
import { NFTMetadataOwner } from "../../schema";
import { ClaimVerification } from "../../types";
import { BaseERC721 } from "../../types/eips";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { IStorage } from "../interfaces/IStorage";
import { TransactionResultWithId } from "../types";
import { ContractMetadata } from "./contract-metadata";
import { ContractWrapper } from "./contract-wrapper";
import { DropClaimConditions } from "./drop-claim-conditions";
import { Erc721 } from "./erc-721";
/**
 * Claim lazily minted ERC721 NFTs
 * @remarks Manage claim phases and claim ERC721 NFTs that have been lazily minted.
 * @example
 * ```javascript
 * const contract = await sdk.getContract("{{contract_address}}");
 * await contract.drop.claim(quantity);
 * ```
 */
export class Erc721Claimable implements DetectableFeature {
  featureName = FEATURE_NFT_CLAIMABLE.name;

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
  public claimConditions: DropClaimConditions<BaseERC721 & Drop>;

  private metadata: ContractMetadata<BaseERC721 & Drop, any>;
  private contractWrapper: ContractWrapper<BaseERC721 & Drop>;
  private erc721: Erc721;
  private storage: IStorage;

  constructor(
    erc721: Erc721,
    contractWrapper: ContractWrapper<BaseERC721 & Drop>,
    storage: IStorage,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;

    this.storage = storage;
    this.metadata = new ContractMetadata(
      contractWrapper,
      SmartContract.schema,
      storage,
    );
    this.claimConditions = new DropClaimConditions(
      contractWrapper,
      this.metadata,
      storage,
    );
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
   * @param proofs - Array of proofs
   *
   * @returns - an array of results containing the id of the token claimed, the transaction receipt and a promise to optionally fetch the nft metadata
   */
  public async claimTo(
    destinationAddress: string,
    quantity: BigNumberish,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    const claimVerification = await this.prepareClaim(quantity, proofs);
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
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this.claimTo(
      await this.contractWrapper.getSignerAddress(),
      quantity,
      proofs,
    );
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * Returns proofs and the overrides required for the transaction.
   *
   * @returns - `overrides` and `proofs` as an object.
   */
  private async prepareClaim(
    quantity: BigNumberish,
    proofs: BytesLike[] = [utils.hexZeroPad([0], 32)],
  ): Promise<ClaimVerification> {
    return prepareClaim(
      quantity,
      await this.claimConditions.getActive(),
      (await this.metadata.get()).merkle,
      0,
      this.contractWrapper,
      this.storage,
      proofs,
    );
  }
}
