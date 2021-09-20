import { ProviderOrSigner } from "../core";
export interface NFTMetadata {
    id: string;
    uri: string;
    name?: string;
    description?: string;
    image?: string;
    attributes?: Record<string, any>;
}
export declare function getMetadata(provider: ProviderOrSigner, contractAddress: string, tokenId: string, ipfsGatewayUrl: string): Promise<NFTMetadata>;
export declare function getMetadataUri(provider: ProviderOrSigner, contractAddress: string, tokenId: string): Promise<string>;
