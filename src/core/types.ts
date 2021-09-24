import type { Network, Provider } from "@ethersproject/providers";
import type { Signer } from "ethers";

export type ProviderOrSigner = Provider | Signer;

export type ValidProviderInput = ProviderOrSigner | Network | string;
