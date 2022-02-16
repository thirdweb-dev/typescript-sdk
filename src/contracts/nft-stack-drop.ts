import { Erc1155 } from "../core/classes/erc-1155";
import { DropERC1155, DropERC1155__factory } from "@thirdweb-dev/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import { SDKOptions } from "../schema/sdk-options";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  CommonNFTInput,
  NFTMetadata,
  NFTMetadataInput,
} from "../schema/tokens/common";
import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { hexZeroPad } from "ethers/lib/utils";
import { prepareClaim } from "../common/claim-conditions";
import { DropErc1155ClaimConditions } from "../core/classes/drop-erc1155-claim-conditions";
import { DropErc1155ContractSchema } from "../schema/contracts/drop-erc1155";
import { ContractEncoder } from "../core/classes/contract-encoder";

/**
 * Setup a collection of NFTs with a customizable number of each NFT that are minted as users claim them.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const nftStackDrop = sdk.getNFTStackDrop("{{contract_address}}");
 * ```
 *
 * @public
 */
export class NFTStackDrop extends Erc1155<DropERC1155> {
  static contractType = "nft-stack-drop" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = DropERC1155__factory;
  /**
   * @internal
   */
  static schema = DropErc1155ContractSchema;

  public metadata: ContractMetadata<DropERC1155, typeof NFTStackDrop.schema>;
  public roles: ContractRoles<
    DropERC1155,
    typeof NFTStackDrop.contractRoles[number]
  >;
  public royalty: ContractRoyalty<DropERC1155, typeof NFTStackDrop.schema>;
  public primarySale: ContractPrimarySale<DropERC1155>;
  public claimConditions: DropErc1155ClaimConditions;
  public encoder: ContractEncoder<DropERC1155>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<DropERC1155>(
      network,
      address,
      NFTStackDrop.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      NFTStackDrop.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      NFTStackDrop.contractRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySale = new ContractPrimarySale(this.contractWrapper);
    this.claimConditions = new DropErc1155ClaimConditions(
      this.contractWrapper,
      this.metadata,
      this.storage,
    );
    this.encoder = new ContractEncoder(this.contractWrapper);
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  // TODO getAllClaimerAddresses() - should be done via an indexer

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

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
   */
  public async createBatch(
    metadatas: NFTMetadataInput[],
  ): Promise<TransactionResultWithId<NFTMetadata>[]> {
    const startFileNumber =
      await this.contractWrapper.readContract.nextTokenIdToMint();
    const batch = await this.storage.uploadMetadataBatch(
      metadatas.map((m) => CommonNFTInput.parse(m)),
      startFileNumber.toNumber(),
      this.contractWrapper.readContract.address,
      await this.contractWrapper.getSigner()?.getAddress(),
    );
    const receipt = await this.contractWrapper.sendTransaction("lazyMint", [
      batch.metadataUris.length,
      `${batch.baseUri.endsWith("/") ? batch.baseUri : `${batch.baseUri}/`}`,
    ]);
    const event = this.contractWrapper.parseEventLogs(
      "LazyMintedTokens",
      receipt?.logs,
    );
    const [startingIndex, endingIndex]: BigNumber[] = event;
    const results = [];
    for (let id = startingIndex; id.lte(endingIndex); id = id.add(1)) {
      results.push({
        id,
        receipt,
        data: () => this.getTokenMetadata(id),
      });
    }
    return results;
  }

  /**
   * Claim NFTs to a specific Wallet
   *
   * @remarks Let the specified wallet claim NFTs.
   *
   * @example
   * ```javascript
   * const address = "{{wallet_address}}"; // address of the wallet you want to claim the NFTs
   * const tokenId = 0; // the id of the NFT you want to claim
   * const quantity = 1; // how many NFTs you want to claim
   *
   * const tx = await contract.claimTo(address, quantity);
   * const receipt = tx.receipt; // the transaction receipt
   * const claimedTokenId = tx.id; // the id of the NFT claimed
   * const claimedNFT = await tx.data(); // (optional) get the claimed NFT metadata
   * ```
   *
   * @param destinationAddress - Address you want to send the token to
   * @param tokenId - Id of the token you want to claim
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - Receipt for the transaction
   */
  public async claimTo(
    destinationAddress: string,
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionResult> {
    const claimData = await this.prepareClaim(tokenId, quantity, proofs);
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "claim",
        [destinationAddress, tokenId, quantity, claimData.proofs],
        claimData.overrides,
      ),
    };
  }

  /**
   * Claim a token to the connected wallet
   *
   * @remarks See {@link NFTStackDrop.claimTo}
   *
   * @param tokenId - Id of the token you want to claim
   * @param quantity - Quantity of the tokens you want to claim
   * @param proofs - Array of proofs
   *
   * @returns - Receipt for the transaction
   */
  public async claim(
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ): Promise<TransactionResult> {
    const address = await this.contractWrapper.getSignerAddress();
    return this.claimTo(address, tokenId, quantity, proofs);
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
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ) {
    return prepareClaim(
      quantity,
      await this.claimConditions.getActive(tokenId),
      (await this.metadata.get()).merkle,
      this.contractWrapper,
      this.storage,
      proofs,
    );
  }
}
