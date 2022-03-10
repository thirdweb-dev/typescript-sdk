import { BigNumberish } from "ethers";
import { FileBufferOrString } from "../../schema";

/**
 * Options for deploying an NFT contract
 * @public
 */
export interface NFTContractDeployMetadata {
  /**
   * name of the contract
   */
  name: string;
  /**
   * Optional description of the contract
   */
  description?: string;
  /**
   * Optional image for the contract
   */
  image?: FileBufferOrString;
  /**
   * Optional url for the contract
   */
  external_link?: string;
  /**
   * Symbol for the NFTs
   */
  symbol?: string;
  /**
   * The gasless forwarder address (Biconomy or OZ Defender)
   */
  trusted_forwarder?: string;
  /**
   * The address that will receive the proceeds from primary sales
   */
  primary_sale_recipient: string;
  /**
   * The address that will receive the proceeds from secondary sales (royalties)
   */
  fee_recipient?: string;
  /**
   * The percentage (in basis points) of royalties for secondary sales
   */
  seller_fee_basis_points?: number;
  /**
   * The address that will receive the proceeds from platform fees
   */
  platform_fee_recipient?: string;
  /**
   * The percentage (in basis points) of platform fees
   */
  platform_fee_basis_points?: number;
}

/**
 * Options for deploying a Token contract
 * @public
 */
export interface TokenContractDeployMetadata {
  /**
   * name of the contract
   */
  name: string;
  /**
   * Optional description of the contract
   */
  description?: string;
  /**
   * Optional image for the contract
   */
  image?: FileBufferOrString;
  /**
   * Optional url for the contract
   */
  external_link?: string;
  /**
   * Symbol for the NFTs
   */
  symbol?: string;
  /**
   * The gasless forwarder address (Biconomy or OZ Defender)
   */
  trusted_forwarder?: string;
  /**
   * The address that will receive the proceeds from primary sales
   */
  primary_sale_recipient: string;
  /**
   * The address that will receive the proceeds from platform fees
   */
  platform_fee_recipient?: string;
  /**
   * The percentage (in basis points) of platform fees
   */
  platform_fee_basis_points?: number;
}

/**
 * Options for deploying a Marketplace contract
 * @public
 */
export interface MarketplaceContractDeployMetadata {
  /**
   * name of the contract
   */
  name: string;
  /**
   * Optional description of the contract
   */
  description?: string;
  /**
   * Optional image for the contract
   */
  image?: FileBufferOrString;
  /**
   * Optional url for the contract
   */
  external_link?: string;
  /**
   * The gasless forwarder address (Biconomy or OZ Defender)
   */
  trusted_forwarder?: string;
  /**
   * The address that will receive the proceeds from platform fees
   */
  platform_fee_recipient?: string;
  /**
   * The percentage (in basis points) of platform fees
   */
  platform_fee_basis_points?: number;
}

/**
 * Options for deploying a Vote contract
 * @public
 */
export interface VoteContractDeployMetadata {
  /**
   * name of the contract
   */
  name: string;
  /**
   * Optional description of the contract
   */
  description?: string;
  /**
   * Optional image for the contract
   */
  image?: FileBufferOrString;
  /**
   * Optional url for the contract
   */
  external_link?: string;
  /**
   * The gasless forwarder address (Biconomy or OZ Defender)
   */
  trusted_forwarder?: string;
  /**
   * The address of the governance token contract representing votes
   */
  voting_token_address: string;
  /**
   * The delay in blocks before voting can begin on proposals
   */
  voting_delay_in_blocks?: number;
  /**
   * The duration in blocks of the open voting window
   */
  voting_period_in_blocks?: number;
  /**
   * The minimum amount in governance token owned to be able to vote
   */
  proposal_token_threshold?: BigNumberish;
  /**
   * The minimum fraction to be met to pass a proposal
   */
  voting_quorum_fraction?: number;
}

/**
 * @public
 */
export interface SplitRecipientInput {
  /**
   * The recipient address
   */
  address: string;
  /**
   * the shares that address is owed from the total funds
   */
  shares: BigNumberish;
}

/**
 * Options for deploying Split contract
 * @public
 */
export interface SplitContractDeployMetadata {
  /**
   * name of the contract
   */
  name: string;
  /**
   * Optional description of the contract
   */
  description?: string;
  /**
   * Optional image for the contract
   */
  image?: FileBufferOrString;
  /**
   * Optional url for the contract
   */
  external_link?: string;
  /**
   * The gasless forwarder address (Biconomy or OZ Defender)
   */
  trusted_forwarder?: string;
  /**
   * The list of recipients and their share of the split
   */
  recipients: SplitRecipientInput[];
}
