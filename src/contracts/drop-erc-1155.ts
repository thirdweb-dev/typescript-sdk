import { Erc1155 } from "../core/classes/erc-1155";
import { DropERC1155, DropERC1155__factory } from "@3rdweb/contracts";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResultPromise,
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
 * const contract = sdk.getBundleDropContract("{{contract_address}}");
 * ```
 *
 * @public
 */
export class DropErc1155Contract extends Erc1155<DropERC1155> {
  static contractType = "DropERC1155" as const;
  static schema = DropErc1155ContractSchema;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = DropERC1155__factory;

  public metadata: ContractMetadata<
    DropERC1155,
    typeof DropErc1155Contract.schema
  >;
  public roles: ContractRoles<
    DropERC1155,
    typeof DropErc1155Contract.contractRoles[number]
  >;
  public royalty: ContractRoyalty<
    DropERC1155,
    typeof DropErc1155Contract.schema
  >;
  public primarySales: ContractPrimarySale<DropERC1155>;
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
      DropErc1155Contract.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      DropErc1155Contract.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      DropErc1155Contract.contractRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySales = new ContractPrimarySale(this.contractWrapper);
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
   * Create Many NFTs
   *
   * @remarks Create and mint NFTs.
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
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }];
   *
   * await contract.createBatch(metadatas);
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
    // TODO figure out how to type the return types of parseEventLogs
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
   * // Address of the wallet you want to claim the NFTs
   * const address = "{{wallet_address}}";
   *
   * // The number of NFTs to claim
   * const quantity = 1;
   *
   * // The token ID of the NFT you want to claim
   * const tokenId = "0"
   *
   * await contract.claimTo(address, tokenId, quantity);
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
  ): TransactionResultPromise {
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
  ): TransactionResultPromise {
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
