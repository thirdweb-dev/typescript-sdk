import { BigNumberish } from "ethers";

/**
 * @public
 */
export type NFTContractDeployMetadata = {
  name: string;
  symbol?: string;
  trusted_forwarder?: string;
  primary_sale_recipient?: string;
  fee_recipient?: string;
  seller_fee_basis_points?: number;
  platform_fee_recipient?: string;
  platform_fee_basis_points?: number;
};

/**
 * @public
 */
export type TokenContractDeployMetadata = {
  name: string;
  symbol?: string;
  trusted_forwarder?: string;
  primary_sale_recipient?: string;
  platform_fee_recipient?: string;
  platform_fee_basis_points?: number;
};

/**
 * @public
 */
export type MarketplaceContractDeployMetadata = {
  name: string;
  trusted_forwarder?: string;
  platform_fee_recipient?: string;
  platform_fee_basis_points?: number;
};

/**
 * @public
 */
export type VoteContractDeployMetadata = {
  name: string;
  trusted_forwarder?: string;
  voting_token_address: string;
  voting_delay_in_blocks?: number;
  voting_period_in_blocks?: number;
  proposal_token_threshold?: BigNumberish;
  voting_quorum_fraction?: number;
};

/**
 * @public
 */
export type SplitRecipientInput = {
  address: string;
  shares: BigNumberish;
};

/**
 * @public
 */
export type SplitContractDeployMetadata = {
  name: string;
  trusted_forwarder?: string;
  recipients: SplitRecipientInput[];
};
