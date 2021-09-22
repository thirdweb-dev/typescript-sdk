import { ProviderOrSigner } from "../core";
import { NFTCollection } from "../types";
export interface NFTMetadata {
    id: string;
    uri: string;
    name?: string;
    description?: string;
    image?: string;
    attributes?: Record<string, any>;
}
export declare function getMetadataWithoutContract(provider: ProviderOrSigner, contractAddress: string, tokenId: string, ipfsGatewayUrl: string): Promise<NFTMetadata>;
export declare function getMetadata(contract: NFTCollection, tokenId: string, ipfsGatewayUrl: string): Promise<NFTMetadata>;
export declare function getMetadataUri(contract: NFTCollection, tokenId: string): Promise<string>;
