import type { ProviderOrSigner } from ".";
import { SupportedChainId } from "./constants";
export declare function getChainIdByProviderOrSigner(providerOrSigner: ProviderOrSigner): Promise<SupportedChainId>;
