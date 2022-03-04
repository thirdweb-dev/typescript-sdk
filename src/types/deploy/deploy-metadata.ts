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

export type TokenContractDeployMetadata = {
  name: string;
  symbol: string;
  trusted_forwarder: string;
  primary_sale_recipient: string;
  platform_fee_recipient: string;
  platform_fee_basis_points: number;
};
