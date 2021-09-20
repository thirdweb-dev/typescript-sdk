import { ProviderOrSigner } from "../core";
export interface ContractMetadata {
    uri: string;
    name?: string;
    description?: string;
    image?: string;
    external_link?: string;
    seller_fee_basis_points?: number;
    fee_recipient?: string;
}
export declare function getContractMetadata(provider: ProviderOrSigner, address: string, ipfsGatewayUrl: string): Promise<ContractMetadata>;
