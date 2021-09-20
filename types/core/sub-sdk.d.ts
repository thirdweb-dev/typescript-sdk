import type { ProviderOrSigner, SDKOptions } from "./";
export declare class SubSDK {
    protected opts: SDKOptions;
    providerOrSigner: ProviderOrSigner;
    readonly address: string;
    constructor(providerOrSigner: ProviderOrSigner, address: string, opts: SDKOptions);
    getSignerAddress(): Promise<string>;
}
